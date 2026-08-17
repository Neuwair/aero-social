##Notice
AeroSocial's development is currently on hold, I'm planning a NEW roadmap to improve this project, cheers.

# AeroSocial
Created by Neuwair | 🍋 Illustrator and Programmer | イラストレーター兼プログラミング学生
- [Twitter](https://x.com/neuwair) | [Pixiv](https://www.pixiv.net/en/users/102019144) | [Insta](https://www.instagram.com/neuwair404) | [YouTube](https://www.youtube.com/@Neuwair)

![image1](https://github.com/user-attachments/assets/10d2a35e-7038-4ee4-ba31-14109a7ca7f3)

## My first programming project
AeroSocial is a technical showcase designed to demonstrate my understanding of core web development fundamentals. 
It’s built entirely with vanilla HTML, CSS, and JavaScript, using only a few libraries and no frameworks. 
My goal was to understand the basics before moving on to frameworks or more advanced technologies.

The design of this website is reminiscent of the early 2000s, it draws from a nostalgic and humanistic Frutiger Aero style, 
I wanted the UI to look tuneful and somewhat modern. This is not a production-ready social network, I wanted to show what 
I can do as a solo developer with a clear focus on his first project.

This project has taken me 5 months to complete. I've faced many difficulties and the website has gone through various re-designs, 
I've also refactored most of my code to keep it modular and as DRY as I can. I feel rather happy about that, because I've learned 
a lot and if it wasn't for those mistakes this website wouldn't look as good.

💻 **This is a project technical concept website, not meant to be a fully functional social network, thank you for understanding.**

Good things take time.
- [🍋 AeroSocial Website](https://aerosocial.netlify.app/)
> [!TIP]
> **You don’t need to use a real email address, accounts are automatically deleted after 10 minutes.**

## 🧩 Challenges I faced while creating Kakioki
AeroSocial is my first real programming project. I had built plenty of basic websites before, but I’d never taken on a full project from 
start to finish. Working with JavaScript was challenging at first, but after experimenting and troubleshooting a lot, I developed a solid 
foundational understanding of it. Looking back after completing my second project, [Kakioki](https://github.com/Neuwair/kakioki), I can see 
how working on more complex features like user authentication and databases in vanilla JavaScript was tough. However, that experience made 
using frameworks later feel much more intuitive, I wouldn’t have found them as easy to handle without first learning the core principles 
through vanilla JS, CSS and HTML.

## UI Overview
### SignUp and LogIn forms
<img width="494" height="912" alt="1" src="https://github.com/user-attachments/assets/d6e790c5-9135-4ee6-94e0-48f5a4b308cc" />

### User profile
<img width="492" height="908" alt="2" src="https://github.com/user-attachments/assets/926906bd-b31e-47fe-bf58-f6475d08117b" />

### Post writer and created posts
<img width="479" height="914" alt="3" src="https://github.com/user-attachments/assets/8d1d1aac-6a29-4d52-a24a-ab2f2281cac8" />

### News section
<img width="479" height="914" alt="4" src="https://github.com/user-attachments/assets/85f34304-4b69-428d-8542-c1a3c5c03306" />

# FAQ
## How does the user authentication work?
**The client first obtains a CSRF token, then sends the user credentials to the server handler.** The server validates both the CSRF 
token and the credentials through the authentication service. After successful validation, it creates a database session and sets 
a secure session cookie. All following requests use this cookie, which is verified before any protected user data is returned.

## How is the database implemented?
**A NeonDB client is lazily initialised, with migrations enforcing the schema.** Compact, domain-specific modules handle queries for 
users, sessions, false-friends, false-followers, and simulations for these, and these modules are consumed by the Netlify function endpoints.

## How does the media system work?
**The media system is a client-side manager responsible for validating user-selected files using the media validation modules.** It generates previews 
via blob URLs, tracks uploaded files and their URLs, and allows users to remove previews, revoking URLs and cleaning up state. When a post is submitted, 
the post module receives the File objects, appends the media to the post DOM, and tracks created URLs for later cleanup. Profile avatar and banner uploads 
are handled separately with IndexedDB persistence and default assets.

## How does false-friends and false-followers work?
**The false-friends and false-followers simulation is a toggleable demo mode. Client-side modules query backend simulation endpoints.** These endpoints either 
poll or return simulated data, which is injected into the UI as follower counts, synthetic follower lists, and generated posts. On the server side, Netlify 
functions and helper utilities manage and persist simulation state, generating deterministic or randomised fake users, follower relationships, and posts for 
testing. The friend-request manager and its avatar/service helpers surface “false friends” on the client, while the followers simulation provides aggregated 
fake follower data. Toggling the simulation updates the server state, prompting clients to refresh their UI accordingly.
