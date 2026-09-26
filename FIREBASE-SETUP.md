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

Anyone can create an account, but only the people in the program's **Staff**
list (and the owner named in the rules) can see or change the data. Anyone else
sees "The account … is not allowed to use this program". People who create an
account with an e-mail and password are sent a verification link. They can
sign in after opening it, so nobody can claim a colleague's address first.

### B. Publish the security rules

1. Go to **Build > Firestore Database > Rules**.
2. Paste in the whole of `firestore.rules` and click **Publish**. The line
   `signedEmail() in ['mhmd.ihsn80@gmail.com']` names the owner, who can
   always sign in, even before the staff list exists. Add a second owner there
   only if you need one.

You do not have to edit the rules to add people any more. The **Staff** page in
the program keeps the sign-in list up to date (see D).

### C. Sign in, on the PC first

1. **On the PC that has the correct data**, open the program and sign in on the first screen. Because the cloud is empty, the PC's data is uploaded.
2. **On the phone**, open the same web address and sign in. When
   it asks which data to use, choose **Use the cloud data**. The phone now shows
   the PC's data.

   Do not choose "Upload this device's data" on the phone. That would replace
   the PC's data in the cloud.

### D. Add your staff

1. Open **Management > Staff** in the side bar. Press **Add me as Administrator** first.
2. Press **Add staff member** for each person: their name, the e-mail they sign
   in with (Google or e-mail and password), designation and **role**.
   - Leave **Create a sign-in account with a starting password** ticked to
     create their account for them. The program sends them a verification
     e-mail. They open it, sign in with the starting password, and are asked
     to choose their own password straight away. The Staff list shows
     "Starting password" until they have done this.
   - Untick it for people who sign in with Google.
   - To add many people at once, press **Download template**, fill it in with
     Excel (Name, Email, Designation, Phone, Role, Status and an optional
     Password per person), save it, then press **Import from Excel**. You can
     import `.xlsx` or `.csv` files. A preview shows which rows are ready and
     which have a problem, such as a bad e-mail, a duplicate or an unknown role.
   - Open a staff member and press **Send password reset e-mail** if someone
     forgets their password. Everyone can also use **Change password** in their
     account menu.
3. Under **Roles & permissions** you can see and change what each role may do:

   | Role | Level | Can |
   |---|---|---|
   | Administrator | 5 | everything, including staff and settings |
   | Head of procurement | 4 | requests, authorise, budget, RFQs, award, cancel, projects, vendors |
   | Procurement officer | 3 | requests, RFQs and quotes, projects, vendors |
   | Finance officer | 3 | budget checks and budgets, award and mark paid |
   | Authoriser | 3 | authorise requests up to 50,000 MVR |
   | Viewer | 1 | look only |

   Each role can have an **approval limit**. Nobody in that role can authorise a
   request, or select a winning quote, above that amount. You can add your own
   roles too.

Adding, disabling or removing someone updates who can sign in straight away.
Their role applies the next time they open the program. The roles control the
buttons in the program. The Firestore rules decide who may open the data at all.

## Day to day

- Changes are saved to the cloud about 1–2 seconds after you make them. The
  other devices pick them up within about 15 seconds while the program is open,
  or straight away when you open it. The account menu (your initials, top right)
  shows the last sync time.
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
  else. The office data can only be read by the people in the Staff list.

## Look and feel

- The **Dashboard** opens first. It shows open cases, quotes, projects, the
  budget, recent activity, upcoming tasks and a **Quick request** form.
- The bell (top right) lists what needs attention, such as quotes received,
  requests to authorise and overdue projects.
- Light or dark mode: use the moon or sun button, or the account menu. Each
  device remembers its own choice.
