# Firebase setup

The program uses the council's Firebase project **milandhoopro** for two things:

1. **Sync between devices.** Every computer and phone that signs in with the
   office account shows the same cases, budgets and settings.
2. **Online vendor replies.** Vendors get a short link such as
   `https://mcprocurement.edgeone.dev/?q=k7pq2x`, enter their rates and press
   **Submit**. The quote is recorded in the program by itself.

## One-time setup (about 5 minutes)

### A. Sign-in methods

The program opens on a sign-in screen. Staff can:

- sign in with **Google**, or
- use any e-mail address (Gmail, Outlook, a council address and so on): press
  **Create account** once to choose a password, then use **Sign in**. There is
  also **Forgot password?**, which e-mails a reset link.

1. Open <https://console.firebase.google.com> and choose **milandhoopro**.
2. Go to **Build > Authentication > Sign-in method**. Turn on **Google** and
   **Email/Password** (the first switch only).
3. Go to **Authentication > Settings > Authorized domains** and add
   `mcprocurement.edgeone.dev`, plus any other address the program is opened
   from. Without this, Google sign-in shows "not allowed on … yet".
4. Under **Authentication > Settings > User actions**, keep **Enable create
   (sign-up)** ticked. **Create account** needs it.

Anyone can create an account, but only the e-mail addresses listed in the
rules (step B) can see or change the data. Anyone else sees "The account … is
not allowed to use this program". To let a new staff member in, add their
e-mail to the list and publish the rules again.

### B. Publish the security rules

1. Go to **Build > Firestore Database > Rules**.
2. Paste in the whole of `firestore.rules`. In the line
   `request.auth.token.email in ['office@example.com']`, replace
   `office@example.com` with the e-mail address of each person who may use
   the program: their Google (Gmail) address, or the e-mail and password account
   you created. For example
   `['procurement@council.mv', 'someone@gmail.com']`.
3. Click **Publish**.

### C. Sign in, on the PC first

1. **On the PC that has the correct data**, open the program and sign in on the first screen. Because the cloud is empty, the PC's data is uploaded.
2. **On the phone**, open the same web address and sign in. When
   it asks which data to use, choose **Use the cloud data**. The phone now shows
   the PC's data.

   Do not choose "Upload this device's data" on the phone. That would replace
   the PC's data in the cloud.

## Day to day

- Changes are saved to the cloud about 1–2 seconds after you make them. The
  other devices pick them up within about 15 seconds while the program is open,
  or straight away when you open it. On a computer, the side bar shows
  "Synced HH:MM".
- If the same data was changed on two devices at the same moment, the program
  asks which version to keep.
- **Save backup file** under Settings still works. Keep taking backups now and
  then.

## Vendor links

- Create an RFQ with **"Send to vendor"** and issue it. The RFQ page shows the
  short link, with **Copy link** and **Share on WhatsApp** buttons.
- The program checks for replies every 15 seconds. When one arrives, the RFQ
  shows **Received** and the quote appears in **Compare quotes**.
- A vendor can submit only once. To let a vendor change a quote, use
  **Revise…** on the RFQ, which gives it a new link.
- Anyone holding a vendor link can open that one RFQ and its reply, and nothing
  else. The office data can only be read by the e-mails listed in the rules.
