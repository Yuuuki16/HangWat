"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { EventFormInput } from "@/features/events/components/eventFormInput";
import { EventFormSubmitButton } from "@/features/events/components/eventFormSubmitButton";
import { createEvent } from "@/features/events/services/eventApi";
import {
  resolveGoogleMapsUrl,
  type ResolvedLocation,
} from "@/features/events/services/locationApi";
import { saveEventMemberId } from "@/features/events/utils/eventMemberStorage";

export function EventCreateForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [locationUrl, setLocationUrl] = useState("");
  const [resolvedLocation, setResolvedLocation] =
    useState<ResolvedLocation | null>(null);
  const [isResolving, setIsResolving] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [detail, setDetail] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleLocationUrlChange(value: string) {
    setLocationUrl(value);
    setResolvedLocation(null);
    setLocationError(null);
  }

  async function handleResolveLocation() {
    const trimmedUrl = locationUrl.trim();
    if (trimmedUrl === "" || isResolving) {
      return;
    }

    setLocationError(null);
    setIsResolving(true);

    try {
      const result = await resolveGoogleMapsUrl(trimmedUrl);
      if (result.ok) {
        setResolvedLocation(result.data.location);
      } else {
        setResolvedLocation(null);
        setLocationError(result.message);
      }
    } finally {
      setIsResolving(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) {
      return;
    }

    setErrorMessage(null);
    setIsSubmitting(true);

    const trimmedDetail = detail.trim();

    try {
      const result = await createEvent({
        title: title.trim(),
        date: date === "" ? null : date,
        location: resolvedLocation,
        description: trimmedDetail === "" ? null : trimmedDetail,
      });

      if (result.ok) {
        const { event: createdEvent } = result.data;
        saveEventMemberId(createdEvent.id, createdEvent.myMember.id);
        router.push("/home");
        return;
      }

      setErrorMessage(result.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full max-w-md flex-col gap-10">
      {errorMessage && (
        <p
          role="alert"
          className="whitespace-pre-line rounded-base border-2 border-red-400 bg-red-50 px-4 py-3 text-base text-red-700"
        >
          {errorMessage}
        </p>
      )}

      <div className="flex flex-col gap-1">
        <label htmlFor="event-title" className="text-lg text-primary">
          タイトル
        </label>
        <EventFormInput
          id="event-title"
          name="title"
          type="text"
          required
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="ここに入力"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="event-date" className="text-lg text-primary">
          日時
        </label>
        <EventFormInput
          id="event-date"
          name="date"
          type="date"
          required
          value={date}
          onChange={(event) => setDate(event.target.value)}
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="event-location" className="text-lg text-primary">
          場所(任意)
        </label>
        <div className="flex gap-2">
          <EventFormInput
            id="event-location"
            name="location"
            type="url"
            value={locationUrl}
            onChange={(event) => handleLocationUrlChange(event.target.value)}
            placeholder="Google Maps の URL を貼り付け"
            className="flex-1"
          />
          <button
            type="button"
            onClick={handleResolveLocation}
            disabled={isResolving || locationUrl.trim() === ""}
            className="shrink-0 rounded-base bg-primary px-4 py-2 text-sm text-white shadow-md transition-opacity hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isResolving ? "取得中..." : "場所を取得"}
          </button>
        </div>
        {locationError && (
          <p role="alert" className="text-sm text-red-700">
            {locationError}
          </p>
        )}
        {resolvedLocation && (
          <div className="rounded-base border-2 border-primary/40 bg-primary/5 px-3 py-2 text-sm">
            <p className="font-medium text-foreground">
              {resolvedLocation.name}
            </p>
            {resolvedLocation.address && (
              <p className="text-foreground/70">{resolvedLocation.address}</p>
            )}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="event-detail" className="text-lg text-primary">
          詳細(任意)
        </label>
        <EventFormInput
          id="event-detail"
          name="detail"
          type="text"
          value={detail}
          onChange={(event) => setDetail(event.target.value)}
          placeholder="ここに入力"
        />
      </div>

      <div className="flex justify-center pt-4">
        <EventFormSubmitButton disabled={isSubmitting}>
          {isSubmitting ? "作成中..." : "作成"}
        </EventFormSubmitButton>
      </div>
    </form>
  );
}
