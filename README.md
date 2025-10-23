# Triplexa - Travel Agency Management System

Triplexa is a comprehensive travel agency management platform designed to streamline operations, enhance customer experience, and optimize business processes for travel agencies.

![Triplexa](public/placeholder.svg)

## Features

- **Agent Management**: Approve, reject, and manage agent applications
- **Booking Management**: Track and manage customer bookings
- **Enquiry Workflow**: Handle customer inquiries efficiently
- **Proposal Builder**: Create professional travel proposals
- **Inventory Management**: Manage hotel and activity inventory
- **Itinerary Planning**: Build detailed travel itineraries
- **Sales Dashboard**: Monitor sales performance metrics
- **SEO Tools**: Optimize online presence
- **PDF Generation**: Create professional documents for clients
- **Multi-currency Support**: Handle transactions in various currencies

## Tech Stack

- **Frontend**: React, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **State Management**: React Context API
- **Styling**: Tailwind CSS with custom components

## Getting Started

### Prerequisites

- Node.js (v16+)
- npm or yarn
- Git

### Installation

1. Clone the repository
   ```bash
   git clone https://github.com/wouldcart/triplexa.git
   cd triplexa
   ```

2. Install dependencies
   ```bash
   npm install
   # or
   yarn install
   ```

3. Set up environment variables
   - Create a `.env` file in the root directory
   - Add necessary environment variables (see `.env.example` if available)

4. Start the development server
   ```bash
   npm run dev
   # or
   yarn dev
   ```

5. Open your browser and navigate to `http://localhost:8080`

## Project Structure

```
triplexa/
├── src/                  # Source files
│   ├── components/       # UI components
│   ├── contexts/         # React contexts
│   ├── hooks/            # Custom React hooks
│   ├── pages/            # Page components
│   ├── services/         # API services
│   ├── types/            # TypeScript type definitions
│   └── utils/            # Utility functions
├── public/               # Static assets
├── supabase/             # Supabase configuration and migrations
└── docs/                 # Documentation
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is proprietary and confidential.

## Contact

Project Link: [https://github.com/wouldcart/triplexa](https://github.com/wouldcart/triplexa)
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/84ed78e1-b891-46b7-bd4a-084336c132f5) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)
