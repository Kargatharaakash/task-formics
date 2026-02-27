# Event Management App - Technical Interview Prep

This document breaks down the core architecture, dependencies, and state management of your Event Management App in simple, easy-to-speak language.

---

## 🏗️ 1. Architecture & Tech Stack

The application is a **Full-Stack Web App** built entirely within the Next.js framework. It uses the modern **App Router** (`app/` directory), which means both the front-end (UI) and the back-end (database logic) live in the same project.

*   **Frontend (UI):** React and Tailwind CSS.
*   **Backend (API & Logic):** Next.js Server Components and Server Actions.
*   **Database:** SQLite (for local development) / PostgreSQL (Neon) for production, managed by Prisma ORM.

---

## 📦 2. Dependencies (`package.json`) Explained

Here is exactly what every major package in your project does, explained in one simple sentence so you can speak about them easily:

### Core Framework
*   **`next`**: The core React framework that gives us our folder-based routing, server-side rendering, and API routes out of the box.
*   **`react` & `react-dom`**: The fundamental library used for building the user interface using components.

### Database
*   **`@prisma/client` & `prisma`**: Our ORM (Object-Relational Mapper). It lets us talk to our database using simple JavaScript code instead of writing raw, complicated SQL queries.

### Calendar & UI Tools
*   **`@fullcalendar/react` (and related packages)**: A powerful, flexible calendar library that gives us the beautiful Monthly, Weekly, and Daily views for our events.
*   **`lucide-react`**: A library of clean, modern outline icons used throughout the app (like the trash can, edit pencil, and sidebar icons).
*   **`next-themes`**: An incredibly simple tool that handles the switching between Light Mode, Dark Mode, and System preferences without flickering on load.
*   **`sonner`**: A highly customizable "toast" notification library. We use this to show the little success or error popups in the corner of the screen when a user saves or deletes something.

### Styling (Tailwind UI / shadcn)
*   **`tailwindcss` / `autoprefixer` / `postcss`**: The CSS framework that lets us style components rapidly by adding utility classes (like `flex` or `text-center`) directly into our HTML, instead of writing separate CSS files.
*   **`clsx` & `tailwind-merge` & `class-variance-authority`**: Tiny helper tools. They safely combine multiple Tailwind CSS classes together in our components, ensuring that if we override a style (like changing a button from blue to red), the correct color wins.

---

## 🧠 3. State Management

*"How do you manage state in your application?"* is a very common interview question. Here is how you should answer it for this specific project:

**We do not use Redux, Zustand, or Context API.** Because we are using the modern Next.js App Router, we rely on a combination of Server State and local React State.

1.  **Server State (The Database):**
    For data that needs to persist (like Events and Users), we do not store massive lists in the browser's memory. Instead, we use Next.js Server Components to fetch data directly from Prisma on the server. When data changes (like deleting an event), we hit an API route and tell Next.js to refresh the page route, re-fetching the fresh data automatically.
2.  **Local Component State (The UI):**
    For simple UI interactions (like "is this sidebar open?" or "what text did the user type in this input box?"), we use standard React hooks like `useState`.

*   **Why this approach?** It keeps the app incredibly simple, lightweight, and fast. By leaning on the server to hold our "truth" (the database), we avoid the complexity of having to carefully synchronize a massive Redux store with our backend.

---

## 🔄 4. How Data Flows (Example: Deleting an Event)

If they ask you *how* something works conceptually, use this flow as an example:

1.  **The Trigger:** The user clicks the "Delete" button (handled by our `DeleteEventButton` component).
2.  **The Request:** The component's `useState` sets `isLoading` to true (to show a spinner), and then it makes a simple `DELETE` HTTP request using `fetch()` to our backend route (`/api/events/[id]`).
3.  **The Backend:** The Next.js API route checks if the user is authenticated, and if they have permission, it tells Prisma to delete the row in the database.
4.  **The Result:** The API sends back a success message. The React component sets `isLoading` back to false, and then calls `router.refresh()`. This tells Next.js to instantly re-fetch the data from the server, causing the deleted event to vanish from the screen seamlessly.
