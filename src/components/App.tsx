{
  "updated_file_content": "const raw = $json.text || $json.response || $json.data || $json.content || \"\";\n\nlet parsed;\n\ntry {\n  parsed = typeof raw === \"string\" ? JSON.parse(raw) : raw;\n} catch {\n  parsed = raw;\n}\n\nreturn [\n  {\n    json: {\n      code: parsed.modified_part || raw\n    }\n  }\n];",
  "summary": "تم استلام طلب غير واضح. لذلك لم يتم تغيير أي شيء من الملف."
}