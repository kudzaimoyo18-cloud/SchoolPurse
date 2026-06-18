-- ECD report lines store a competency descriptor (rating) instead of a numeric
-- mark. Academic lines use `marks`; ECD lines use `rating`.
alter table public.report_card_lines
  add column if not exists rating text;
