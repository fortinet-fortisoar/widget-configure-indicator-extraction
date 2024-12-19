# What's New

- The indicator extraction configuration wizard now has an intuitive, wizard-like user interface.

- A search option helps find indicators in the exclude list and groups the results as per indicator type

- Using the bulk import feature, you can now import multiple indicators, in various formats (`.csv`, `.txt`, `.pdf`, `.xls`, `.xlsx`, `.doc`, `.docx`) of different types in one go.

- Manually entered indicators are validated and duplicate, unsupported, and invalid indicators are ignored.

- To capture, or exclude, indicators you can even create a custom indicator type and corresponding custom Regex!

- Each indicator type field now features the regex used for indicator extraction

- The field mapping screen of the wizard helps map various alert and incident fields to different indicator types. On this page you can:

    - Choose if you want to create indicators of type *File* from all email attachments found in alerts of type *Suspicious Mail* and *Phishing*.

    - Choose if you want to add a comment to the alert when a file is excluded from extraction
