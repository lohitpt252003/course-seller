# CourseHub Frontend

React (Vite) frontend for the Course Seller platform.

## Tech Stack

- **React** with Vite for fast development
- **React Router** for client-side routing
- **Axios** for API communication
- **Vanilla CSS** with CSS variables for theming

## Key Pages

| Page | Route | Description |
|------|-------|-------------|
| Login | `/login` | Common login page with role-based redirect |
| Register | `/register` | Student registration with "Apply to Teach" link |
| Student Dashboard | `/dashboard` | Learning progress, enrolled courses, "Become a Teacher" banner |
| Teacher Dashboard | `/teacher` | Course management, analytics, revenue tracking |
| Admin Dashboard | `/admin` | User management, course approval, teacher application review |
| Apply to Teach | `/apply-teacher` | Multi-step teacher application form with PDF CV upload |
| Checkout | `/checkout/:courseId` | Dummy payment with 5 methods (Credit Card, Debit Card, UPI, Net Banking, QR Scanner), coupon codes |
| Course Detail | `/courses/:id` | Course info, lessons, reviews, enrollment |
| Course Player | `/learn/:courseId` | Video/PDF lesson player with progress tracking |
| Profile | `/profile` | User profile management |
| Courses | `/courses` | Browse and search courses |

## Features

- **Teacher Application Flow**: Students apply via multi-step form (motivation, qualifications, PDF CV upload, course plan, demo video). Application status tracked with visual status cards (pending/approved/rejected).
- **Dummy Payments**: 5 payment methods, coupon codes (LEARN50, WELCOME20, FREE100), order summary sidebar, processing animation, success screen.
- **Theme Switching**: Dark/Light mode with CSS variables
- **Role-Based Access**: ProtectedRoute component restricts pages by user role
- **Responsive Design**: Mobile-friendly layouts

## Development

```bash
npm install
npm run dev
```

The app runs on `http://localhost:3000` and proxies API calls to `http://localhost:8000`.
