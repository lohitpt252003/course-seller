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
| Admin Dashboard | `/admin` | User & Manager permissions, course approval, application review, testimonials. (Coupons are Admin-only) |
| Apply to Teach | `/apply-teacher` | Multi-step teacher application form with PDF CV upload |
| Checkout | `/checkout/:courseId` | Dummy payment with 5 methods, dynamic backend-validated coupon codes with expiry dates |
| Course Detail | `/courses/:id` | Course info, public demo lecture, lesson outline preview, reviews, enrollment |
| Course Player | `/learn/:courseId` | Paid learning player for lessons, DPPs, quizzes, and assignments |
| Profile | `/profile` | User profile management |
| Courses | `/courses` | Browse and search courses |

## Features

- **Teacher Application Flow**: Students apply via multi-step form (motivation, qualifications, PDF CV upload, course plan, demo video). Application status tracked with visual status cards (pending/approved/rejected).
- **Dummy Payments & Coupons**: 5 payment methods, backend-validated coupon system with optional expiration dates (Admin only management), order summary sidebar, processing animation, success screen.
- **Course Preview Flow**: Guests and unpaid users can see course structure and an optional public demo lecture before purchase.
- **Rich Post-Purchase Learning**: The course player now supports `video`, `pdf`, `ppt`, `text`, `markdown_code`, `dpp`, `quiz`, `assignment_manual`, and `assignment_autograded`.
- **Submission UX**: Learners can submit quiz answers, manual assignments, and autograded code directly from the player and see latest result/feedback.
- **Alumni Testimonials**: Public Home page display of success stories managed by Admins/Managers via the Admin Dashboard.
- **Theme Switching**: Dark/Light mode with CSS variables
- **Role-Based Access**: ProtectedRoute component restricts pages by user role (`admin`, `manager`, `teacher`, `student`).
- **Responsive Design**: Mobile-friendly layouts

## Development

```bash
npm install
npm run dev
```

The app runs on `http://localhost:3000` and proxies API calls to `http://localhost:8000`.
