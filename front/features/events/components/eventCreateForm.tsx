"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { EventFormInput } from "@/features/events/components/eventFormInput";
import { EventFormSubmitButton } from "@/features/events/components/eventFormSubmitButton";
import { createEvent } from "@/features/events/services/eventApi";

export function EventCreateForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [location, setLocation] = useState("");
  const [detail, setDetail] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) {
      return;
    }

    setErrorMessage(null);
    setIsSubmitting(true);

    const trimmedLocation = location.trim();
    const trimmedDetail = detail.trim();

    try {
      const result = await createEvent({
        title: title.trim(),
        date: date === "" ? null : date,
        location:
          trimmedLocation === ""
            ? null
            : {
                name: trimmedLocation,
                address: null,
                googlePlaceId: null,
                latitude: null,
                longitude: null,
                googleMapsUrl: null,
              },
        description: trimmedDetail === "" ? null : trimmedDetail,
      });

      if (result.ok) {
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
        <EventFormInput
          id="event-location"
          name="location"
          type="text"
          value={location}
          onChange={(event) => setLocation(event.target.value)}
          placeholder="ここに入力"
        />
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
