# Online vendor replies: setup (Firebase)

Vendors get a short link such as `https://mcprocurement.edgeone.dev/?q=k7pq2x`.
They open it, enter their rates, sign and press **Submit**. The quote is saved
in the council's Firebase project (**milandhoopro**, default Firestore
database). The program then records it by itself: the RFQ shows **Received**,
and the quote appears in **Compare quotes**.

The program already contains the project's web settings (project id and web
API key). These are meant to be public; the security rules below are what
protect the data.

## One-time setup: publish the security rules

1. Open <https://console.firebase.google.com>, choose **milandhoopro**, then
   **Firestore Database > Rules**.
2. Replace everything in the editor with the contents of `firestore.rules`, then
   click **Publish**.
3. Open the program and go to **Settings & backup > Online vendor replies**.
   Click **Test connection**. It should say "Connected".

Until the rules are published, Firestore refuses every request, and the program
says so on the RFQ page.

## Day to day

- Create an RFQ with **"Send to vendor"** and issue it. The RFQ page shows the
  short link, with **Copy link** and **Share on WhatsApp** buttons.
- While the program is open, it checks for replies every 15 seconds. When one
  arrives, you see "Quote received from …".
- A vendor can submit only once. To let a vendor change a quote, use
  **Revise…** on the RFQ, which gives it a new link.
- Every link and reply can be seen in the Firebase console under
  **Firestore Database > Data**, in the `rfqs` and `replies` collections.
