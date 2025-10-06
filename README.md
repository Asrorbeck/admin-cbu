# HR Admin Dashboard

A modern, responsive React admin panel for government HR management system built with Vite and Tailwind CSS.

## Features

- **Clean & Professional UI**: Minimal design with neutral colors, no gradients or flashy effects
- **Fully Responsive**: Works perfectly on mobile, tablet, and desktop devices
- **Department Management**: Create, edit, delete, and view departments
- **Vacancy Management**: Manage job positions within departments
- **Table & Card Views**: Toggle between table and card layouts
- **Toast Notifications**: Success/error feedback using react-hot-toast
- **Confirmation Dialogs**: Safe delete operations with react-confirm-alert
- **Modern Routing**: React Router DOM for seamless navigation

## Tech Stack

- **Frontend**: React 18 with Vite
- **Styling**: Tailwind CSS
- **Routing**: React Router DOM
- **Notifications**: react-hot-toast
- **Confirmations**: react-confirm-alert
- **Icons**: Heroicons (via Tailwind)

## Project Structure

```
src/
├── components/
│   ├── cards/
│   │   ├── DepartmentsCards.jsx
│   │   └── VacanciesCards.jsx
│   ├── modals/
│   │   ├── EditDepartmentModal.jsx
│   │   └── EditVacancyModal.jsx
│   ├── tables/
│   │   ├── DepartmentsTable.jsx
│   │   └── VacanciesTable.jsx
│   ├── Layout.jsx
│   └── Sidebar.jsx
├── data/
│   └── sampleData.js
├── pages/
│   ├── Departments.jsx
│   ├── DepartmentDetails.jsx
│   ├── NewDepartment.jsx
│   └── NewVacancy.jsx
├── App.jsx
├── main.jsx
└── index.css
```

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:

   ```bash
   npm install
   ```

3. Start the development server:

   ```bash
   npm run dev
   ```

4. Open your browser and navigate to `http://localhost:5173`

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Features Overview

### 1. Departments Page (`/departments`)

- View all departments in table or card format
- Add new departments
- Edit existing departments
- Delete departments with confirmation
- View department details

### 2. Department Details Page (`/departments/:id`)

- View department information
- Manage vacancies within the department
- Add new vacancies
- Edit/delete existing vacancies
- Toggle between table and card views

### 3. New Department Form (`/departments/new`)

- Create new departments with:
  - Department name
  - Responsibilities
  - Obligations

### 4. New Vacancy Form (`/departments/:id/new-vacancy`)

- Create new job positions with:
  - Position title
  - Salary
  - Status (Active/Inactive)
  - Additional notes

## Design Principles

- **Accessibility**: Proper contrast ratios and keyboard navigation
- **Mobile-First**: Responsive design starting from mobile devices
- **Clean Typography**: Consistent font sizes and spacing
- **Neutral Colors**: Gray, white, and blue accent colors
- **No Animations**: Clean, professional appearance without distracting effects

## Sample Data

The application includes sample data for:

- 4 departments (IT, Finance, HR, Legal)
- Multiple vacancies across different departments
- Realistic salary ranges and job descriptions

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.
