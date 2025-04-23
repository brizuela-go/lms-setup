├─ README.md
├─ app
│ ├─ (auth)
│ │ └─ login
│ │ └─ page.tsx
│ ├─ (student)
│ │ ├─ calendar
│ │ │ └─ page.tsx
│ │ ├─ dashboard
│ │ │ └─ page.tsx
│ │ ├─ homeworks
│ │ │ └─ page.tsx
│ │ ├─ layout.tsx
│ │ ├─ profile
│ │ │ └─ page.tsx
│ │ └─ subjects
│ │ ├─ [id]
│ │ │ ├─ homeworks
│ │ │ │ ├─ [homeworkId]
│ │ │ │ │ └─ page.tsx
│ │ │ │ └─ page.tsx
│ │ │ └─ page.tsx
│ │ └─ page.tsx
│ ├─ admin
│ │ ├─ layout.tsx
│ │ ├─ page.tsx
│ │ ├─ students
│ │ │ └─ page.tsx
│ │ └─ subjects
│ │ └─ page.tsx
│ ├─ api
│ │ ├─ auth
│ │ │ └─ [...nextauth]
│ │ │ └─ route.ts
│ │ ├─ enrollments
│ │ │ ├─ route.ts
│ │ │ └─ status
│ │ │ └─ route.ts
│ │ ├─ grades
│ │ │ └─ route.ts
│ │ ├─ homeworks
│ │ │ └─ route.ts
│ │ ├─ notifications
│ │ │ ├─ [id]
│ │ │ │ └─ read
│ │ │ │ └─ route.ts
│ │ │ ├─ readAll
│ │ │ │ └─ route.ts
│ │ │ └─ route.ts
│ │ ├─ students
│ │ │ ├─ check
│ │ │ │ └─ route.ts
│ │ │ └─ route.ts
│ │ ├─ submissions
│ │ │ └─ route.ts
│ │ ├─ uploadthing
│ │ │ ├─ core.ts
│ │ │ └─ route.ts
│ │ └─ users
│ │ └─ [id]
│ │ ├─ password
│ │ │ └─ route.ts
│ │ └─ route.ts
│ ├─ favicon.ico
│ ├─ globals.css
│ ├─ layout.tsx
│ ├─ loading.tsx
│ ├─ page.tsx
│ └─ teacher
│ ├─ enrollments
│ │ └─ page.tsx
│ ├─ homeworks
│ │ └─ create
│ │ └─ page.tsx
│ ├─ layout.tsx
│ ├─ page.tsx
│ ├─ students
│ │ ├─ [id]
│ │ └─ page.tsx
│ └─ subjects
│ └─ [id]
│ └─ homeworks
│ └─ [homeworkId]
│ └─ submissions
│ └─ [submissionId]
│ └─ page.tsx
├─ auth.ts
├─ components
│ ├─ enrollments
│ │ └─ enrollment-actions.tsx
│ ├─ homeworks
│ │ ├─ create-homework-form.tsx
│ │ ├─ grade-submission-form.tsx
│ │ └─ submit-homework-form.tsx
│ ├─ layout
│ │ ├─ admin-sidebar.tsx
│ │ ├─ footer.tsx
│ │ ├─ student-navbar.tsx
│ │ └─ teacher-sidebar.tsx
│ ├─ login-form.tsx
│ ├─ notifications
│ │ └─ notifications-view.tsx
│ ├─ profile
│ │ └─ profile-forms.tsx
│ ├─ students
│ │ └─ student-creation-dialog.tsx
│ ├─ subjects
│ │ └─ subject-creation-dialog.tsx
│ ├─ theme-provider.tsx
│ ├─ ui
│ │ ├─ accordion.tsx
│ │ ├─ alert-dialog.tsx
│ │ ├─ alert.tsx
│ │ ├─ aspect-ratio.tsx
│ │ ├─ avatar.tsx
│ │ ├─ badge.tsx
│ │ ├─ breadcrumb.tsx
│ │ ├─ button.tsx
│ │ ├─ calendar.tsx
│ │ ├─ card.tsx
│ │ ├─ carousel.tsx
│ │ ├─ chart.tsx
│ │ ├─ checkbox.tsx
│ │ ├─ collapsible.tsx
│ │ ├─ command.tsx
│ │ ├─ context-menu.tsx
│ │ ├─ dialog.tsx
│ │ ├─ drawer.tsx
│ │ ├─ dropdown-menu.tsx
│ │ ├─ form.tsx
│ │ ├─ hover-card.tsx
│ │ ├─ input-otp.tsx
│ │ ├─ input.tsx
│ │ ├─ label.tsx
│ │ ├─ menubar.tsx
│ │ ├─ navigation-menu.tsx
│ │ ├─ pagination.tsx
│ │ ├─ popover.tsx
│ │ ├─ progress.tsx
│ │ ├─ radio-group.tsx
│ │ ├─ resizable.tsx
│ │ ├─ scroll-area.tsx
│ │ ├─ select.tsx
│ │ ├─ separator.tsx
│ │ ├─ sheet.tsx
│ │ ├─ sidebar.tsx
│ │ ├─ skeleton.tsx
│ │ ├─ slider.tsx
│ │ ├─ sonner.tsx
│ │ ├─ switch.tsx
│ │ ├─ table.tsx
│ │ ├─ tabs.tsx
│ │ ├─ textarea.tsx
│ │ ├─ toggle-group.tsx
│ │ ├─ toggle.tsx
│ │ └─ tooltip.tsx
│ └─ upload
│ └─ file-uploader.tsx
├─ components.json
├─ eslint.config.mjs
├─ hooks
│ └─ use-mobile.ts
├─ lib
│ └─ utils.ts
├─ middleware.ts
├─ next.config.ts
├─ package.json
├─ pnpm-lock.yaml
├─ postcss.config.mjs
├─ prisma
│ ├─ migrations
│ │ ├─ 20250421032356_init_next
│ │ │ └─ migration.sql
│ │ ├─ 20250421050911_shash
│ │ │ └─ migration.sql
│ │ └─ migration_lock.toml
│ ├─ schema.prisma
│ └─ seed.ts
├─ prisma.ts
├─ public
│ ├─ dark-logo.png
│ ├─ light-logo.png
│ ├─ login-background.jpg
│ └─ opengraph.png
├─ tsconfig.json
├─ types
│ └─ index.ts
└─ utils
├─ password.ts
└─ uploadthing.ts

```

```
