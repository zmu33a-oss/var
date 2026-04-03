const raw = $json.text || $json.response || $json.data || $json.content || "";

let parsed;

try {
  parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
} catch {
  parsed = raw;
}

return [
  {
    json: {
      code: parsed.modified_part || raw
    }
  }
];
