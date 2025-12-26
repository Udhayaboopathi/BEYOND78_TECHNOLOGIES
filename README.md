# Data Management System

A full-stack web application for managing commodities, UOMs, blends, locations, counter parties, and capacity data.

## Tech Stack

- **Backend**: FastAPI + SQLAlchemy + MySQL
- **Frontend**: React + Material-UI
- **Database**: MySQL

## Project Structure

```
project/
├── backend/
│   ├── main.py              # FastAPI application and endpoints
│   ├── database.py          # Database connection configuration
│   ├── models.py            # SQLAlchemy models
│   ├── schemas.py           # Pydantic schemas
│   ├── requirements.txt     # Python dependencies
│   └── .env.example         # Environment variables template
├── frontend/
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── App.js           # Main React app
│   │   ├── api.js           # API client
│   │   └── index.js         # Entry point
│   └── package.json         # Node dependencies
└── summa.sql                # Database schema
```

## Setup Instructions

### 1. Database Setup

First, create your MySQL database and run the schema:

```bash
# Create database
mysql -u root -p -e "CREATE DATABASE your_database_name;"

# Import the schema
mysql -u root -p your_database_name < summa.sql
```

### 2. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create .env file from example
copy .env.example .env  # Windows
# OR
cp .env.example .env    # macOS/Linux

# Edit .env file with your database credentials
# Example: DATABASE_URL=mysql+pymysql://root:yourpassword@localhost:3306/your_database_name

# Run the backend server
python main.py
```

The backend will run on `http://localhost:8000`

### 3. Frontend Setup

```bash
# Navigate to frontend directory (open new terminal)
cd frontend

# Install dependencies
npm install

# Start the development server
npm start
```

The frontend will run on `http://localhost:3000`

## API Endpoints

### Commodities

- `GET /api/commodities` - Get all commodities
- `GET /api/commodities/{id}` - Get commodity by ID

### UOMs

- `GET /api/uoms` - Get all UOMs
- `GET /api/uoms/{id}` - Get UOM by ID

### Blends

- `GET /api/blends` - Get all blends
- `GET /api/blends/{id}` - Get blend by ID

### Blend Components

- `GET /api/blend-components` - Get all blend components
- `GET /api/blend-components/{id}` - Get blend component by ID

### Locations

- `GET /api/locations` - Get all locations
- `GET /api/locations/{id}` - Get location by ID

### Counter Parties

- `GET /api/counter-parties` - Get all counter parties
- `GET /api/counter-parties/{id}` - Get counter party by ID

### Capacity

- `GET /api/capacity` - Get all capacity data
- `GET /api/capacity/{id}` - Get capacity by ID

## Features

- ✅ RESTful API with FastAPI
- ✅ SQLAlchemy ORM with MySQL
- ✅ React frontend with Material-UI
- ✅ Responsive data tables
- ✅ Navigation sidebar
- ✅ Error handling
- ✅ Loading states
- ✅ CORS enabled

## Development

### Backend

- API documentation available at `http://localhost:8000/docs` (Swagger UI)
- Alternative docs at `http://localhost:8000/redoc` (ReDoc)

### Frontend

- Edit components in `frontend/src/components/`
- API calls configured in `frontend/src/api.js`
- Routing configured in `frontend/src/App.js`

## Environment Variables

### Backend (.env)

```
DATABASE_URL=mysql+pymysql://username:password@localhost:3306/database_name
```

## Troubleshooting

### Backend won't start

- Check MySQL is running
- Verify database credentials in `.env`
- Ensure virtual environment is activated
- Check all dependencies are installed

### Frontend won't start

- Clear node_modules: `rm -rf node_modules && npm install`
- Check port 3000 is available
- Verify Node.js version (recommended: 16+)

### Can't connect to API

- Ensure backend is running on port 8000
- Check CORS settings in `backend/main.py`
- Verify API base URL in `frontend/src/api.js`

## Next Steps

- Add create/update/delete operations
- Implement authentication
- Add data validation
- Add pagination
- Add search/filter functionality
- Add data export features

## License

MIT
