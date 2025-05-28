-- Add attachments column to orders table
-- This will store an array of file metadata as JSONB

ALTER TABLE orders ADD COLUMN attachments JSONB DEFAULT '[]'::jsonb;

-- Add comment to document the structure
COMMENT ON COLUMN orders.attachments IS 'Array of file metadata objects with structure: [{"id": "string", "order_id": "string", "file_name": "string", "file_type": "string", "file_size": number, "file_url": "string", "uploaded_at": "timestamp", "uploaded_by": "string"}]';

-- Create index for better query performance on attachments
CREATE INDEX idx_orders_attachments ON orders USING gin(attachments); 