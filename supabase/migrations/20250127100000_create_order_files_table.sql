-- Create order_files table for file management
CREATE TABLE order_files (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL CHECK (file_type IN ('contract', 'drawing', 'report', 'certificate', 'other')),
  file_size BIGINT NOT NULL CHECK (file_size > 0),
  file_url TEXT NOT NULL,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  uploaded_by TEXT NOT NULL,
  
  -- Foreign key constraint to orders table
  CONSTRAINT fk_order_files_order_id FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);

-- Create indexes for better query performance
CREATE INDEX idx_order_files_order_id ON order_files(order_id);
CREATE INDEX idx_order_files_file_type ON order_files(file_type);
CREATE INDEX idx_order_files_uploaded_at ON order_files(uploaded_at DESC);

-- Enable Row Level Security
ALTER TABLE order_files ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations for authenticated users
-- Users can manage files for orders they have access to
CREATE POLICY "Allow authenticated users to manage order files" ON order_files
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Add comment to document the table purpose
COMMENT ON TABLE order_files IS 'Stores file metadata for order attachments. Files are stored in Supabase Storage.';
COMMENT ON COLUMN order_files.file_type IS 'Type of file: contract, drawing, report, certificate, or other';
COMMENT ON COLUMN order_files.file_size IS 'File size in bytes';
COMMENT ON COLUMN order_files.file_url IS 'Public URL to the file in Supabase Storage';
COMMENT ON COLUMN order_files.uploaded_by IS 'User ID or name who uploaded the file'; 