-- Create orders table
CREATE TABLE orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_number TEXT NOT NULL UNIQUE,
  project_name TEXT NOT NULL,
  client_type TEXT NOT NULL CHECK (client_type IN ('government', 'private')),
  company_name TEXT NOT NULL,
  contract_date DATE,
  contract_amount NUMERIC NOT NULL,
  order_type TEXT NOT NULL CHECK (order_type IN ('new', 'change1', 'change2', 'change3')),
  transport_type TEXT CHECK (transport_type IN ('onsite', 'transport')),
  remediation_method TEXT,
  contamination_info TEXT,
  verification_company TEXT,
  status TEXT NOT NULL CHECK (status IN ('contracted', 'in_progress', 'completed', 'cancelled')),
  progress_percentage INTEGER NOT NULL DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  primary_manager TEXT,
  secondary_manager TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster searches
CREATE INDEX idx_orders_order_number ON orders(order_number);
CREATE INDEX idx_orders_project_name ON orders(project_name);
CREATE INDEX idx_orders_company_name ON orders(company_name);
CREATE INDEX idx_orders_client_type ON orders(client_type);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_order_type ON orders(order_type);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations for authenticated users
CREATE POLICY "Allow all operations for authenticated users" ON orders
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true); 