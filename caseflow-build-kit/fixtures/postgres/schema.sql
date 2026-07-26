CREATE SCHEMA IF NOT EXISTS finance;
CREATE SCHEMA IF NOT EXISTS operations;
CREATE SCHEMA IF NOT EXISTS caseflow;

CREATE TABLE IF NOT EXISTS finance.invoices (
  invoice_id text PRIMARY KEY,
  account_id text NOT NULL,
  order_id text NOT NULL,
  invoice_date date NOT NULL,
  currency char(3) NOT NULL,
  total_amount numeric(18,2) NOT NULL,
  status text NOT NULL
);

CREATE TABLE IF NOT EXISTS finance.invoice_lines (
  invoice_line_id text PRIMARY KEY,
  invoice_id text NOT NULL REFERENCES finance.invoices(invoice_id),
  charge_code text NOT NULL,
  description text NOT NULL,
  quantity numeric(18,4) NOT NULL,
  unit_amount numeric(18,2) NOT NULL,
  line_amount numeric(18,2) NOT NULL
);

CREATE TABLE IF NOT EXISTS finance.payments (
  payment_id text PRIMARY KEY,
  invoice_id text NOT NULL REFERENCES finance.invoices(invoice_id),
  posted_at timestamptz NOT NULL,
  currency char(3) NOT NULL,
  amount numeric(18,2) NOT NULL,
  status text NOT NULL
);

CREATE TABLE IF NOT EXISTS finance.credit_memos (
  credit_memo_id text PRIMARY KEY,
  invoice_id text NOT NULL REFERENCES finance.invoices(invoice_id),
  case_id text NOT NULL,
  external_reference text NOT NULL UNIQUE,
  currency char(3) NOT NULL,
  amount numeric(18,2) NOT NULL CHECK (amount > 0),
  status text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS operations.shipments (
  shipment_id text PRIMARY KEY,
  order_id text NOT NULL,
  account_id text NOT NULL,
  committed_delivery_at timestamptz NOT NULL,
  actual_delivery_at timestamptz,
  status text NOT NULL
);

CREATE TABLE IF NOT EXISTS operations.shipment_events (
  event_id text PRIMARY KEY,
  shipment_id text NOT NULL REFERENCES operations.shipments(shipment_id),
  event_type text NOT NULL,
  event_at timestamptz NOT NULL,
  cause_code text NOT NULL,
  reviewed boolean NOT NULL,
  notes text NOT NULL
);

CREATE TABLE IF NOT EXISTS caseflow.execution_ledger (
  idempotency_key text PRIMARY KEY,
  payload_digest text NOT NULL,
  execution_id text NOT NULL,
  status text NOT NULL,
  finance_receipt jsonb,
  crm_receipt jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
