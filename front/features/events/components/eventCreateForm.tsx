"use client";

import { useState, type FormEvent } from "react";
import { EventFormInput } from "@/features/events/components/eventFormInput";
import { EventFormSubmitButton } from "@/features/events/components/eventFormSubmitButton";

export function EventCreateForm() {
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [location, setLocation] = useState("");
  const [detail, setDetail] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full max-w-md flex-col gap-10">
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
        <EventFormSubmitButton>作成</EventFormSubmitButton>
      </div>
    </form>
  );
}
