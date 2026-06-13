"use client";

import { useState, type FormEvent } from "react";
import { Input } from "@/features/events/components/input";
import { SubmitButton } from "@/features/events/components/submitButton";

export default function EventCreatePage() {
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [location, setLocation] = useState("");
  const [detail, setDetail] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
  }

  return (
    <main className="flex flex-1 flex-col items-center px-6 pb-16 pt-16">
      <form onSubmit={handleSubmit} className="flex w-full max-w-md flex-col gap-10">
        <div className="flex flex-col gap-1">
          <label htmlFor="event-title" className="text-lg text-primary">
            タイトル
          </label>
          <Input
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
          <Input
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
          <Input
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
          <Input
            id="event-detail"
            name="detail"
            type="text"
            value={detail}
            onChange={(event) => setDetail(event.target.value)}
            placeholder="ここに入力"
          />
        </div>

        <div className="flex justify-center pt-4">
          <SubmitButton>作成</SubmitButton>
        </div>
      </form>
    </main>
  );
}
