import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  "https://lkbuqgsdmxzzzuamjtrv.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxrYnVxZ3NkbXh6enp1YW1qdHJ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU5MjEyNTgsImV4cCI6MjA5MTQ5NzI1OH0.QH8yVOHFd0irocFXVK4urzknUi2aqXUTshugCL0HwWk"
);
