'use client';

import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Image from 'next/image';
import {
  Loader2,
  Lock,
  Mail,
  MessageSquare,
  Phone,
  PhoneCall,
  Send,
  Shield,
  Tag,
  User,
  Video,
  Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useViewProWidget } from '@/components/view-pro-widget-provider';
import { api } from '@/lib/api';
import { cn, formatPrice } from '@/lib/utils';
import type { InventoryUnit, ChatGPTResponse } from '@/lib/types';

const PHONE_TEL = 'tel:1-786-570-8584';
const MESSAGE_MAX = 300;

const inquirySchema = z.object({
  name: z.string().min(1, 'Enter your name').max(120),
  email: z.string().email('Enter a valid email').max(254),
  phone: z.string().max(40).optional(),
  message: z.string().min(1, 'Enter a message').max(MESSAGE_MAX, `Max ${MESSAGE_MAX} characters`),
});

type InquiryForm = z.infer<typeof inquirySchema>;

type InventoryContactDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  unit: InventoryUnit;
};

type DialogStep = 'lead' | 'qualify';

type ChatMessage = {
  id: string;
  role: 'assistant' | 'user';
  text: string;
};

const QUALIFICATION_QUESTIONS = [
  { id: 'tradeIn', prompt: 'Do you have a trade-in?', options: ['Yes', 'No', 'Maybe'] },
  { id: 'payment', prompt: 'Are you financing or paying cash?', options: ['Financing', 'Cash', 'Either'] },
  { id: 'timeline', prompt: 'Are you looking to buy soon?', options: ['Yes, ASAP', 'Next 30 Days', 'Just Browsing'] },
] as const;

function unitThumbnailSrc(unit: InventoryUnit): string {
  if (unit.thumbnails?.length) return unit.thumbnails[0]!;
  if (unit.images?.length) return unit.images[0]!;
  if (unit.defaultImageUrl) return unit.defaultImageUrl;
  return '/images/photos_coming_soon.jpg';
}

function estimatedPriceRangeText(unit: InventoryUnit): string {
  if (unit.isTooLowToShow || !unit.websitePrice || unit.websitePrice <= 0) {
    return 'I can share exact pricing as soon as we connect you with a specialist.';
  }

  const low = Math.max(0, unit.websitePrice - 5000);
  const high = unit.websitePrice + 5000;
  return `Based on current availability, this unit is usually selling around ${formatPrice(low)} - ${formatPrice(high)}.`;
}

export function InventoryContactDialog({ open, onOpenChange, unit }: InventoryContactDialogProps) {
  const { isAvailable, open: openLiveWidget } = useViewProWidget();

  const [submitError, setSubmitError] = useState<string | null>(null);
  const [step, setStep] = useState<DialogStep>('lead');
  const [leadName, setLeadName] = useState('');
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [introMessages, setIntroMessages] = useState<ChatMessage[]>([]);
  const [isIntroTyping, setIsIntroTyping] = useState(false);
  const [threadMessages, setThreadMessages] = useState<ChatMessage[]>([]);
  const [isThreadTyping, setIsThreadTyping] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<InquiryForm>({
    resolver: zodResolver(inquirySchema),
    defaultValues: { name: '', email: '', phone: '', message: '' },
  });

  const messageValue = watch('message') ?? '';
  const messageLen = messageValue.length;

  const resetDialog = () => {
    setStep('lead');
    setSubmitError(null);
    setLeadName('');
    setAnswers({});
    setIntroMessages([]);
    setIsIntroTyping(false);
    setThreadMessages([]);
    setIsThreadTyping(false);
    setChatMessage('');
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    reset();
  };

  const onOpenChangeInternal = (next: boolean) => {
    onOpenChange(next);
    if (!next) {
      setTimeout(() => {
        resetDialog();
      }, 0);
    }
  };

  const addIntroAssistantMessage = (text: string) => {
    setIntroMessages((prev) => [...prev, { id: crypto.randomUUID(), role: 'assistant', text }]);
  };

  const queueAssistantMessage = (text: string, delayMs = 650) => {
    setIsIntroTyping(true);
    timeoutRef.current = setTimeout(() => {
      addIntroAssistantMessage(text);
      setIsIntroTyping(false);
    }, delayMs);
  };

  const onSubmit = async (data: InquiryForm) => {
    setSubmitError(null);
    try {
      const payload: { name: string; email: string; phone?: string; message: string } = {
        name: data.name.trim(),
        email: data.email.trim(),
        message: data.message.trim(),
      };
      const phone = data.phone?.trim();
      if (phone) {
        payload.phone = phone;
      }
      await api.post('contact', payload);
      setLeadName(payload.name.split(' ')[0] || payload.name);
      setStep('qualify');
      setAnswers({});
      queueAssistantMessage("Got it - I'm pulling the best available pricing on this unit now.");
      queueAssistantMessage(estimatedPriceRangeText(unit));
      queueAssistantMessage('A few quick questions so I can get you the best possible numbers.');
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : 'Something went wrong. Please try again.');
    }
  };

  const onPickAnswer = (value: string) => {
    if (isIntroTyping || isThreadTyping) return;
    const [qid, option] = value.split('::');
    if (!qid || !option) return;

    if (answers[qid]) return;

    const targetIndex = QUALIFICATION_QUESTIONS.findIndex((question) => question.id === qid);
    if (targetIndex === -1) return;

    let unlockedCount = 1;
    for (const question of QUALIFICATION_QUESTIONS) {
      if (answers[question.id]) {
        unlockedCount += 1;
      } else {
        break;
      }
    }
    if (targetIndex > Math.min(unlockedCount - 1, QUALIFICATION_QUESTIONS.length - 1)) return;

    setAnswers((prev) => {
      const next = { ...prev, [qid]: option };
      return next;
    });
  };

  const onSendChat = async () => {
    const message = chatMessage.trim();
    if (!message || isIntroTyping || isThreadTyping) return;

    setThreadMessages((prev) => [...prev, { id: crypto.randomUUID(), role: 'user', text: message }]);
    setIsThreadTyping(true);
    setChatMessage('');

    try {
      const res = (await api.post('chatgpt/chat', { message })) as ChatGPTResponse;
      setThreadMessages((prev) => [...prev, { id: crypto.randomUUID(), role: 'assistant', text: res.data.reply }]);
    } catch {
      setThreadMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          text: "Sorry, I couldn't fetch a response right now. Please try again.",
        },
      ]);
    } finally {
      setIsThreadTyping(false);
    }
  };

  useEffect(() => {
    if (!open || step !== 'qualify') return;
    const el = scrollRef.current;
    if (!el) return;
    const id = requestAnimationFrame(() => {
      el.scrollTop = el.scrollHeight;
    });
    return () => cancelAnimationFrame(id);
  }, [open, step, introMessages, isIntroTyping, threadMessages, isThreadTyping, answers]);

  const thumbSrc = unitThumbnailSrc(unit);
  const allQuestionsAnswered = QUALIFICATION_QUESTIONS.every((question) => Boolean(answers[question.id]));
  return (
    <Dialog open={open} onOpenChange={onOpenChangeInternal}>
      <DialogContent
        showCloseButton
        className="[&>button]:text-foreground h-[90vh] gap-0 overflow-y-auto rounded-xl border-neutral-200 p-0 shadow-xl sm:max-w-xl [&>button]:top-3 [&>button]:right-4 [&>button]:z-30 [&>button]:opacity-70 hover:[&>button]:opacity-100"
      >
        {step === 'lead' ? (
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col">
            <div className="space-y-5 p-6 pb-4">
              <DialogHeader className="space-y-1 pr-8 text-left md:space-y-2">
                <DialogTitle className="text-foreground text-xl leading-tight font-bold tracking-tight md:text-2xl">
                  Get Your Best Price
                </DialogTitle>
                <p className="text-primary text-sm font-medium">It's fast, easy & no obligation.</p>
                <DialogDescription className="text-muted-foreground text-sm leading-relaxed">
                  Tell us a little about yourself and we'll send you{' '}
                  <span className="text-foreground font-semibold">our best available price and availability.</span>
                </DialogDescription>
              </DialogHeader>

              <div className="flex gap-3 rounded-lg border border-neutral-200 bg-neutral-50/80 p-3">
                <div className="bg-muted relative h-[72px] w-[96px] shrink-0 overflow-hidden rounded-md border border-neutral-200">
                  <Image src={thumbSrc} alt={unit.title} fill className="object-cover" sizes="96px" unoptimized />
                </div>
                <div className="min-w-0 flex-1 space-y-0.5">
                  <p className="text-foreground text-sm leading-snug font-semibold">{unit.title}</p>
                  <p className="text-muted-foreground text-xs">
                    Stock# {unit.stockNumber}
                    <br />
                    {unit.location}
                  </p>
                </div>
              </div>

              <div className="divide-border grid grid-cols-1 divide-y rounded-lg border border-neutral-200 bg-neutral-50/80 md:grid-cols-3 md:divide-x md:divide-y-0">
                <div className="flex items-center gap-1 p-2">
                  <Tag className="text-primary size-5 shrink-0" strokeWidth={1.75} aria-hidden />
                  <div className="min-w-0 text-left">
                    <p className="text-foreground text-[11px] leading-tight font-bold sm:text-xs">Best Prices</p>
                    <p className="text-muted-foreground mt-0.5 text-[10px] leading-snug sm:text-[11px]">Every Day</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 p-2">
                  <Zap className="text-primary size-5 shrink-0" strokeWidth={1.75} aria-hidden />
                  <div className="min-w-0 text-left">
                    <p className="text-foreground text-[11px] leading-tight font-bold sm:text-xs">Fast Response</p>
                    <p className="text-muted-foreground mt-0.5 text-[10px] leading-snug sm:text-[11px]">
                      Typically within minutes
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1 p-2">
                  <Shield className="text-primary size-5 shrink-0" strokeWidth={1.75} aria-hidden />
                  <div className="min-w-0 text-left">
                    <p className="text-foreground text-[11px] leading-tight font-bold sm:text-xs">No Obligation</p>
                    <p className="text-muted-foreground mt-0.5 text-[10px] leading-snug sm:text-[11px]">
                      You&apos;re in control
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="inquiry-name" className="text-foreground flex items-center gap-2 text-sm font-medium">
                    <User className="text-muted-foreground size-4 shrink-0" aria-hidden />
                    Full Name
                  </Label>
                  <Input
                    id="inquiry-name"
                    autoComplete="name"
                    placeholder="e.g. John Smith"
                    aria-invalid={!!errors.name}
                    className={cn('border-neutral-200 bg-white', errors.name && 'border-destructive')}
                    {...register('name')}
                  />
                  {errors.name ? <p className="text-destructive text-sm">{errors.name.message}</p> : null}
                </div>

                <div className="space-y-1.5">
                  <Label
                    htmlFor="inquiry-email"
                    className="text-foreground flex items-center gap-2 text-sm font-medium"
                  >
                    <Mail className="text-muted-foreground size-4 shrink-0" aria-hidden />
                    Email
                  </Label>
                  <Input
                    id="inquiry-email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@email.com"
                    aria-invalid={!!errors.email}
                    className={cn('border-neutral-200 bg-white', errors.email && 'border-destructive')}
                    {...register('email')}
                  />
                  <p className="text-muted-foreground text-xs">We&apos;ll email you our best price and details.</p>
                  {errors.email ? <p className="text-destructive text-sm">{errors.email.message}</p> : null}
                </div>

                <div className="space-y-1.5">
                  <Label
                    htmlFor="inquiry-phone"
                    className="text-foreground flex items-center gap-2 text-sm font-medium"
                  >
                    <Phone className="text-muted-foreground size-4 shrink-0" aria-hidden />
                    Phone (optional)
                  </Label>
                  <Input
                    id="inquiry-phone"
                    type="tel"
                    autoComplete="tel"
                    placeholder="(555) 123-4567"
                    aria-invalid={!!errors.phone}
                    className={cn('border-neutral-200 bg-white', errors.phone && 'border-destructive')}
                    {...register('phone')}
                  />
                  <p className="text-muted-foreground text-xs">Optional, but helps us respond faster.</p>
                  {errors.phone ? <p className="text-destructive text-sm">{errors.phone.message}</p> : null}
                </div>

                <div className="space-y-1.5">
                  <Label
                    htmlFor="inquiry-message"
                    className="text-foreground flex items-center gap-2 text-sm font-medium"
                  >
                    <MessageSquare className="text-muted-foreground size-4 shrink-0" aria-hidden />
                    What can we help you with?
                  </Label>
                  <div className="relative">
                    <Textarea
                      id="inquiry-message"
                      rows={4}
                      maxLength={MESSAGE_MAX}
                      placeholder="Trade-in, financing, questions, preferred contact time, etc."
                      aria-invalid={!!errors.message}
                      className={cn(
                        'max-h-[10lh] min-h-[4.5lh] resize-y overflow-y-auto border-neutral-200 bg-white pb-7',
                        errors.message && 'border-destructive',
                      )}
                      {...register('message')}
                    />
                    <span className="text-muted-foreground pointer-events-none absolute right-3 bottom-2 text-xs tabular-nums">
                      {messageLen}/{MESSAGE_MAX}
                    </span>
                  </div>
                  {errors.message ? <p className="text-destructive text-sm">{errors.message.message}</p> : null}
                </div>
              </div>
            </div>

            <div className="border-border bg-muted/30 space-y-4 border-t px-6 py-5">
              {submitError ? <p className="text-destructive text-center text-sm">{submitError}</p> : null}
              <p className="text-muted-foreground flex items-center justify-center gap-1.5 text-xs">
                <Lock className="size-3.5 shrink-0" aria-hidden />
                Your information is safe and secure.
              </p>
              <div className="flex flex-col gap-2.5">
                <Button type="submit" disabled={isSubmitting} size="lg" className="w-full cursor-pointer font-semibold">
                  {isSubmitting ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Sending…
                    </>
                  ) : (
                    'Get My Best Price'
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  onClick={() => onOpenChangeInternal(false)}
                  className="text-foreground hover:text-foreground w-full cursor-pointer border-neutral-300 bg-white font-medium shadow-none hover:bg-neutral-100"
                >
                  No thanks, I&apos;ll pass
                </Button>
              </div>
            </div>
          </form>
        ) : step === 'qualify' ? (
          <div className="flex h-full min-h-0 flex-col bg-white">
            <div className="sticky top-0 z-20 border-b border-slate-700/90 bg-linear-to-r from-slate-950 via-slate-900 to-slate-950 px-4 py-3 text-white">
              <DialogHeader className="space-y-0 text-left">
                <div className="flex items-center gap-3 pr-9">
                  <div className="relative size-10 shrink-0 overflow-hidden rounded-full border border-neutral-200 bg-white">
                    <Image src="/images/robot.png" alt="" fill className="object-cover" sizes="40px" />
                  </div>
                  <div className="min-w-0">
                    <DialogTitle className="text-lg leading-none font-bold">AI Assistant</DialogTitle>
                    <DialogDescription className="mt-1 text-xs text-slate-300">
                      Your La Mesa RV AI Assistant
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>
            </div>
            <div ref={scrollRef} className="min-h-0 flex-1 space-y-3 overflow-y-auto bg-white px-4 py-4">
              {introMessages.map((message) => (
                <div
                  key={message.id}
                  className={cn('flex items-start gap-2', message.role === 'user' ? 'justify-end' : '')}
                >
                  {message.role === 'assistant' ? (
                    <div className="relative mt-1 size-7 shrink-0 overflow-hidden rounded-full border border-slate-300 bg-white">
                      <Image src="/images/robot.png" alt="" fill className="object-cover" sizes="28px" />
                    </div>
                  ) : null}
                  <div
                    className={cn(
                      'max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm shadow-sm',
                      message.role === 'assistant'
                        ? 'rounded-tl-md bg-slate-100 text-slate-800'
                        : 'rounded-tr-md bg-blue-600 text-white',
                    )}
                  >
                    {message.text}
                  </div>
                </div>
              ))}
              {isIntroTyping ? (
                <div className="flex items-start gap-2">
                  <div className="relative mt-1 size-7 shrink-0 overflow-hidden rounded-full border border-slate-300 bg-white">
                    <Image src="/images/robot.png" alt="" fill className="object-cover" sizes="28px" />
                  </div>
                  <div
                    className="rounded-2xl rounded-tl-md bg-slate-100 px-5 py-3 shadow-sm"
                    role="status"
                    aria-label="Assistant is typing"
                  >
                    <span className="inline-flex items-center gap-1.5" aria-hidden>
                      <span className="size-2 animate-bounce rounded-full bg-slate-400/90 [animation-delay:-0.3s]" />
                      <span className="size-2 animate-bounce rounded-full bg-slate-400/90 [animation-delay:-0.15s]" />
                      <span className="size-2 animate-bounce rounded-full bg-slate-400/90" />
                    </span>
                  </div>
                </div>
              ) : null}
              {!isIntroTyping && introMessages.length >= 3 ? (
                <div className="space-y-4 pt-1">
                  {(() => {
                    let visibleCount = 1;
                    for (const question of QUALIFICATION_QUESTIONS) {
                      if (answers[question.id]) {
                        visibleCount += 1;
                      } else {
                        break;
                      }
                    }
                    const boundedVisibleCount = Math.min(visibleCount, QUALIFICATION_QUESTIONS.length);
                    return QUALIFICATION_QUESTIONS.slice(0, boundedVisibleCount);
                  })().map((question) => (
                    <div key={question.id} className="space-y-2">
                      <div className="flex items-start gap-2">
                        <div className="relative mt-1 size-7 shrink-0 overflow-hidden rounded-full border border-slate-300 bg-white">
                          <Image src="/images/robot.png" alt="" fill className="object-cover" sizes="28px" />
                        </div>
                        <div className="inline-flex max-w-[84%] rounded-2xl rounded-tl-md bg-slate-100 px-3.5 py-2.5 text-sm leading-snug text-slate-800">
                          {question.prompt}
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-2 pl-9">
                        {question.options.map((option) => {
                          const locked = Boolean(answers[question.id]);
                          const selected = answers[question.id] === option;
                          return (
                            <button
                              key={`${question.id}-${option}`}
                              type="button"
                              disabled={locked}
                              onClick={() => onPickAnswer(`${question.id}::${option}`)}
                              className={cn(
                                'h-9 rounded-full border text-sm transition',
                                !locked && 'hover:border-primary/30 cursor-pointer',
                                locked && 'cursor-default',
                                selected
                                  ? 'border-primary bg-primary/10 text-primary'
                                  : cn('border-primary/10 bg-white text-slate-700', locked && 'opacity-60'),
                              )}
                            >
                              {option}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}

                  {allQuestionsAnswered ? (
                    <>
                      <div className="flex items-start gap-2 pt-1">
                        <div className="relative mt-1 size-7 shrink-0 overflow-hidden rounded-full border border-slate-300 bg-white">
                          <Image src="/images/robot.png" alt="" fill className="object-cover" sizes="28px" />
                        </div>
                        <div className="max-w-[84%] rounded-2xl rounded-tl-md bg-slate-100 px-3.5 py-2.5 text-sm text-slate-800">
                          Thanks, {leadName || 'there'}! I have everything I need to get you an exact out-the-door
                          price.
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <div className="relative mt-1 size-7 shrink-0 overflow-hidden rounded-full border border-slate-300 bg-white">
                          <Image src="/images/robot.png" alt="" fill className="object-cover" sizes="28px" />
                        </div>
                        <div className="max-w-[84%] rounded-2xl rounded-tl-md bg-slate-100 px-3.5 py-2.5 text-sm text-slate-800">
                          I can connect you with a specialist right now who can review it with you live.
                        </div>
                      </div>
                      <div className="space-y-2.5 pl-9">
                        {isAvailable && (
                          <button
                            type="button"
                            onClick={() => {
                              openLiveWidget();
                              onOpenChangeInternal(false);
                            }}
                            className="flex w-full cursor-pointer items-center gap-3 rounded-xl bg-green-600 px-4 py-3 text-left text-white hover:bg-green-700"
                          >
                            <Video className="size-5 shrink-0" />
                            <span className="leading-tight">
                              <span className="block text-base font-semibold">See This RV Live Now</span>
                              <span className="block text-xs text-green-100">Talk face-to-face</span>
                            </span>
                          </button>
                        )}
                        <a
                          href={PHONE_TEL}
                          className="flex w-full items-center gap-3 rounded-xl border border-slate-300 px-4 py-3 text-left text-slate-800 hover:bg-slate-50"
                        >
                          <PhoneCall className="size-5 shrink-0" />
                          <span className="leading-tight">
                            <span className="block text-base font-semibold">Connect by Phone</span>
                            <span className="block text-xs text-slate-500">Talk with a specialist</span>
                          </span>
                        </a>
                      </div>
                    </>
                  ) : null}
                </div>
              ) : null}
              {threadMessages.map((message) => (
                <div
                  key={message.id}
                  className={cn('flex items-start gap-2', message.role === 'user' ? 'justify-end' : '')}
                >
                  {message.role === 'assistant' ? (
                    <div className="relative mt-1 size-7 shrink-0 overflow-hidden rounded-full border border-slate-300 bg-white">
                      <Image src="/images/robot.png" alt="" fill className="object-cover" sizes="28px" />
                    </div>
                  ) : null}
                  <div
                    className={cn(
                      'max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm shadow-sm',
                      message.role === 'assistant'
                        ? 'rounded-tl-md bg-slate-100 text-slate-800'
                        : 'rounded-tr-md bg-blue-600 text-white',
                    )}
                  >
                    {message.text}
                  </div>
                </div>
              ))}
              {isThreadTyping ? (
                <div className="flex items-start gap-2">
                  <div className="relative mt-1 size-7 shrink-0 overflow-hidden rounded-full border border-slate-300 bg-white">
                    <Image src="/images/robot.png" alt="" fill className="object-cover" sizes="28px" />
                  </div>
                  <div
                    className="rounded-2xl rounded-tl-md bg-slate-100 px-5 py-3 shadow-sm"
                    role="status"
                    aria-label="Assistant is typing"
                  >
                    <span className="inline-flex items-center gap-1.5" aria-hidden>
                      <span className="size-2 animate-bounce rounded-full bg-slate-400/90 [animation-delay:-0.3s]" />
                      <span className="size-2 animate-bounce rounded-full bg-slate-400/90 [animation-delay:-0.15s]" />
                      <span className="size-2 animate-bounce rounded-full bg-slate-400/90" />
                    </span>
                  </div>
                </div>
              ) : null}
            </div>
            <div className="space-y-2 border-t bg-white px-4 py-3">
              <div className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2">
                <input
                  type="text"
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      void onSendChat();
                    }
                  }}
                  placeholder="Type a message..."
                  className="h-7 min-w-0 flex-1 border-0 bg-transparent text-base text-slate-700 placeholder:text-slate-400 focus:outline-none"
                />
                <button
                  type="button"
                  aria-label="Send message"
                  onClick={() => void onSendChat()}
                  disabled={isIntroTyping || isThreadTyping || !chatMessage.trim()}
                  className="ml-auto inline-flex size-7 items-center justify-center rounded-full bg-blue-600 text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Send className="size-3.5" />
                </button>
              </div>
              <p className="text-center text-[11px] text-slate-500">
                AI can make mistakes. Please verify important info.
              </p>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
