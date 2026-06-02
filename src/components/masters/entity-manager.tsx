"use client";

import { useState, useTransition } from "react";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { MasterInput } from "@/lib/repositories/masters";
import type { MasterActionResult } from "@/app/masters/actions";

export interface EntityRow {
  id: string;
  name: string;
  email?: string | null;
  relationId?: string | null;
}

interface RelationConfig {
  label: string;
  options: { id: string; name: string }[];
  noneLabel?: string; // 비어있음 선택지 라벨
}

export interface EntityManagerProps {
  items: EntityRow[];
  createAction: (input: MasterInput) => Promise<MasterActionResult>;
  updateAction: (id: string, input: MasterInput) => Promise<MasterActionResult>;
  deleteAction: (id: string) => Promise<MasterActionResult>;
  nameLabel: string;
  namePlaceholder?: string;
  hasEmail?: boolean;
  relation?: RelationConfig;
  /** 관계 id → 표시명 (목록 비편집 시 참고용은 select가 대신함) */
}

const selectClass =
  "border-input bg-card h-9 rounded-md border px-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring";

export function EntityManager(props: EntityManagerProps) {
  const { items, createAction, hasEmail, relation } = props;

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [relationId, setRelationId] = useState("");
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();

  function add() {
    setError(undefined);
    startTransition(async () => {
      const result = await createAction({
        name,
        email: hasEmail ? email : undefined,
        relationId: relation ? relationId || null : undefined,
      });
      if (result?.error) {
        setError(result.error);
      } else {
        setName("");
        setEmail("");
        setRelationId("");
      }
    });
  }

  return (
    <div className="flex flex-col gap-3">
      {/* 추가 바 */}
      <Card className="flex flex-wrap items-end gap-2 p-3">
        <LabeledInput
          label={props.nameLabel}
          value={name}
          onChange={setName}
          placeholder={props.namePlaceholder}
        />
        {hasEmail && (
          <LabeledInput
            label="이메일"
            value={email}
            onChange={setEmail}
            placeholder="name@company.com"
            type="email"
          />
        )}
        {relation && (
          <label className="flex flex-col gap-1 text-xs">
            <span className="text-muted-foreground">{relation.label}</span>
            <select
              className={selectClass}
              value={relationId}
              onChange={(e) => setRelationId(e.target.value)}
            >
              <option value="">{relation.noneLabel ?? "— 없음 —"}</option>
              {relation.options.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name}
                </option>
              ))}
            </select>
          </label>
        )}
        <Button size="sm" onClick={add} disabled={pending || !name.trim()}>
          <Plus size={15} />
          {pending ? "추가 중…" : "추가"}
        </Button>
        {error && <p className="w-full text-xs text-red-600">{error}</p>}
      </Card>

      {/* 목록 */}
      {items.length === 0 ? (
        <p className="text-muted-foreground rounded-md border border-dashed px-3 py-6 text-center text-sm">
          등록된 항목이 없습니다.
        </p>
      ) : (
        <div className="flex flex-col gap-1.5">
          {items.map((item) => (
            <EditableRow key={item.id} item={item} {...props} />
          ))}
        </div>
      )}
    </div>
  );
}

function EditableRow({
  item,
  updateAction,
  deleteAction,
  hasEmail,
  relation,
}: { item: EntityRow } & EntityManagerProps) {
  const [name, setName] = useState(item.name);
  const [email, setEmail] = useState(item.email ?? "");
  const [relationId, setRelationId] = useState(item.relationId ?? "");
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();

  const dirty =
    name !== item.name ||
    (hasEmail && email !== (item.email ?? "")) ||
    (!!relation && relationId !== (item.relationId ?? ""));

  function save() {
    setError(undefined);
    startTransition(async () => {
      const result = await updateAction(item.id, {
        name,
        email: hasEmail ? email : undefined,
        relationId: relation ? relationId || null : undefined,
      });
      if (result?.error) setError(result.error);
    });
  }

  function remove() {
    if (!confirm(`"${item.name}" 항목을 삭제할까요?`)) return;
    setError(undefined);
    startTransition(async () => {
      const result = await deleteAction(item.id);
      if (result?.error) setError(result.error);
    });
  }

  return (
    <Card className="flex flex-wrap items-center gap-2 p-2.5">
      <Input
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="h-8 w-48"
      />
      {hasEmail && (
        <Input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="(이메일 없음)"
          type="email"
          className="h-8 w-56"
        />
      )}
      {relation && (
        <select
          className={cn(selectClass, "h-8")}
          value={relationId}
          onChange={(e) => setRelationId(e.target.value)}
        >
          <option value="">{relation.noneLabel ?? "— 없음 —"}</option>
          {relation.options.map((o) => (
            <option key={o.id} value={o.id}>
              {o.name}
            </option>
          ))}
        </select>
      )}

      <div className="ml-auto flex items-center gap-1.5">
        {error && <span className="text-xs text-red-600">{error}</span>}
        <Button
          size="sm"
          variant="outline"
          onClick={save}
          disabled={pending || !dirty || !name.trim()}
        >
          저장
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={remove}
          disabled={pending}
          className="text-red-600 hover:bg-red-50"
        >
          삭제
        </Button>
      </div>
    </Card>
  );
}

function LabeledInput({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <label className="flex flex-col gap-1 text-xs">
      <span className="text-muted-foreground">{label}</span>
      <Input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-9 w-48"
      />
    </label>
  );
}
