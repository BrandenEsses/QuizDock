# QuizDock v2.3.2

## Video Cast discovery

- Corrected the deployed Custom Web Receiver application ID.
- Initializes Google Cast discovery with `VIDEO_OUT` before the route picker opens.
- Uses one consistent Google Cast Base Sender API session path instead of mixing Base and Framework session APIs.
- Rejects malformed receiver application IDs and reports an actionable configuration error.
- Shows the receiver ID and video-discovery state in the host diagnostics.
