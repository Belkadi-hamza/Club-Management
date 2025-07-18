# ClubManager - Sports Club Management System

A comprehensive web application for managing sports clubs, athletes, payments, and activities. Built with React, TypeScript, and Firebase.

## 🏆 Features

### 📊 Dashboard
- Real-time analytics and statistics
- Monthly revenue tracking
- Payment status overview
- Sports distribution charts
- Interactive data visualization with Recharts

### 👥 Athlete Management
- Complete athlete profiles with personal information
- Multi-sport enrollment per athlete
- Active/inactive status tracking
- Advanced search and filtering
- Bulk operations support
- Notes and comments system

### 🏃‍♂️ Sports Management
- Create and manage available sports
- Set pricing per sport
- Track athlete enrollment per sport
- Sport-specific analytics

### 💰 Payment Management
- Automatic payment generation
- Multiple payment statuses (paid, pending, overdue)
- Advance payment support
- Payment history tracking
- Monthly payment reports
- Auto-status updates based on dates

### ⚙️ Settings
- Club profile management
- Account security settings
- Password management
- User preferences

## 🚀 Technology Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS
- **Backend**: Firebase (Authentication, Realtime Database)
- **Charts**: Recharts
- **Icons**: Lucide React
- **Build Tool**: Vite
- **Deployment**: Netlify Ready

## 📋 Prerequisites

- Node.js 16+ 
- npm or yarn
- Firebase account
- Modern web browser

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/clubmanager.git
   cd clubmanager
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Firebase Setup**
   - Create a new Firebase project at [Firebase Console](https://console.firebase.google.com)
   - Enable Authentication (Email/Password and Google)
   - Enable Realtime Database
   - Copy your Firebase configuration
   - Update `src/lib/firebase.ts` with your config

4. **Environment Setup**
   ```bash
   # No additional environment variables needed
   # Firebase config is directly in the code for this demo
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to `http://localhost:5173`

## 🔧 Configuration

### Firebase Configuration

Update the Firebase configuration in `src/lib/firebase.ts`:

```typescript
const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "your-app-id"
};
```

### Database Structure

The application uses Firebase Realtime Database with the following structure:

```json
{
  "clubs": {
    "userId": {
      "id": "userId",
      "name": "Club Name",
      "email": "contact@club.com",
      "phone": "0612345678",
      "sports": {
        "sportId": {
          "id": "sportId",
          "name": "Sport Name"
        }
      },
      "athletes": {
        "athleteId": {
          "id": "athleteId",
          "nom": "Athlete Name",
          "date_naissance": "2000-01-01",
          "telephone": "0612345678",
          "sexe": "Homme",
          "status": "active",
          "sports": {
            "sportId": {
              "sportId": "sportId",
              "sportName": "Sport Name",
              "montant": 200,
              "date_debut": "2024-01-01",
              "paiements": {
                "paymentId": {
                  "id": "paymentId",
                  "mois": "2024-01",
                  "montant": 200,
                  "date_paiement": "2024-01-05",
                  "status": "paid"
                }
              }
            }
          }
        }
      }
    }
  }
}
```

## 📱 Usage

### Getting Started

1. **Create Account**: Register with email/password or Google
2. **Setup Club**: Add your club information and logo
3. **Add Sports**: Create the sports offered by your club
4. **Add Athletes**: Register athletes and assign them to sports
5. **Manage Payments**: Track and record payments

### Key Workflows

#### Adding a New Athlete
1. Go to Athletes page
2. Click "Add Athlete" button
3. Fill in personal information
4. Select sports and set monthly fees
5. Save the athlete

#### Recording Payments
1. Go to Payments page
2. Click "Add Payment" button
3. Select athlete and sport
4. Choose month and amount
5. Set payment status and date

#### Advance Payments
1. Go to Payments page
2. Click "Advance Payment" button
3. Select athlete and sport
4. Choose start month and number of months
5. Confirm the total amount

## 🎨 Customization

### Styling
The application uses Tailwind CSS for styling. You can customize:

- Colors in `tailwind.config.js`
- Components in `src/components/`
- Layouts in `src/pages/`

### Adding New Features
1. Create new components in `src/components/`
2. Add new pages in `src/pages/`
3. Update navigation in `src/components/Layout.tsx`
4. Add new routes in `src/App.tsx`

## 🚀 Deployment

### Netlify Deployment

1. **Build the project**
   ```bash
   npm run build
   ```

2. **Deploy to Netlify**
   - Connect your GitHub repository to Netlify
   - Set build command: `npm run build`
   - Set publish directory: `dist`
   - Deploy

### Manual Deployment

1. **Build for production**
   ```bash
   npm run build
   ```

2. **Upload the `dist` folder** to your hosting provider

## 🔒 Security

- Firebase Authentication handles user security
- Row Level Security (RLS) ensures data isolation
- All data is scoped to authenticated users
- No sensitive data in client-side code

## 📊 Performance

- Lazy loading for optimal performance
- Real-time updates with Firebase
- Responsive design for all devices
- Optimized bundle size with Vite

## 🐛 Troubleshooting

### Common Issues

1. **Firebase Connection Issues**
   - Check your Firebase configuration
   - Ensure Authentication and Database are enabled
   - Verify your domain is authorized

2. **Build Errors**
   - Clear node_modules and reinstall: `rm -rf node_modules && npm install`
   - Check for TypeScript errors: `npm run lint`

3. **Payment Auto-Generation**
   - Payments are auto-generated based on sport start dates
   - Check the browser console for any errors
   - Verify athlete has sports assigned

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit your changes: `git commit -m 'Add feature'`
4. Push to the branch: `git push origin feature-name`
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [React](https://reactjs.org/) - UI Framework
- [Firebase](https://firebase.google.com/) - Backend Services
- [Tailwind CSS](https://tailwindcss.com/) - Styling
- [Lucide React](https://lucide.dev/) - Icons
- [Recharts](https://recharts.org/) - Charts
- [Vite](https://vitejs.dev/) - Build Tool

## 📞 Support

For support, email support@clubmanager.com or create an issue in the GitHub repository.

## 🗺️ Roadmap

- [ ] Mobile app (React Native)
- [ ] Email notifications
- [ ] SMS reminders
- [ ] Advanced reporting
- [ ] Multi-language support
- [ ] API for third-party integrations
- [ ] Bulk import/export
- [ ] Advanced analytics

---

**ClubManager** - Streamline your sports club management with ease! 🏆