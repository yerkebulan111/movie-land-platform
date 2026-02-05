# MovieLand - Movie Review Platform

A full-stack web application built with Node.js, Express, and MongoDB that allows users to discover movies, write reviews, and manage their personal watchlist.

## Table of Contents
- [Project Overview](#project-overview)
- [System Architecture](#system-architecture)
- [Database Schema](#database-schema)
- [API Documentation](#api-documentation)
- [MongoDB Implementation](#mongodb-implementation)
- [Installation & Setup](#installation--setup)
- [Technologies Used](#technologies-used)

## Project Overview

MovieLand is a comprehensive movie review platform that demonstrates advanced NoSQL database design and implementation. The application enables users to:

- Browse and search through a collection of movies
- View detailed movie information including ratings and reviews
- Create and manage personal watchlists
- Write, edit, and delete movie reviews
- View aggregated statistics about movies by genre, year, and director
- Admin panel for user and movie management

The platform implements role-based access control with three user roles:
- **User**: Can browse movies, write reviews, and manage their watchlist
- **Moderator**: Can create, update, and delete movies
- **Admin**: Full system access including user management

## System Architecture

The application follows the **MVC (Model-View-Controller)** architectural pattern:

```
movie-land-platform/
├── config/
│   └── db.js                 # MongoDB connection & index creation
├── controllers/
│   ├── authController.js     # Authentication logic
│   ├── movieController.js    # Movie CRUD & aggregations
│   └── userController.js     # User management
├── middleware/
│   ├── auth.js              # JWT authentication & authorization
│   └── errorHandler.js      # Centralized error handling
├── models/
│   ├── Movie.js             # Movie schema with embedded/referenced data
│   ├── Review.js            # Review schema
│   └── User.js              # User schema with authentication
├── routes/
│   ├── authRoutes.js        # Authentication endpoints
│   ├── movieRoutes.js       # Movie & review endpoints
│   └── userRoutes.js        # User management endpoints
├── public/                  # Frontend (HTML, CSS, JavaScript)
│   ├── css/
│   │   └── style.css        # Main stylesheet (16KB)
│   ├── js/
│   │   ├── admin.js         # Admin panel functionality
│   │   ├── auth.js          # Authentication utilities
│   │   ├── login.js         # Login page logic
│   │   ├── main.js          # Shared utilities & API client
│   │   ├── modal.js         # Modal component logic
│   │   ├── movie-detail.js  # Movie detail page
│   │   ├── movies.js        # Movies listing page
│   │   ├── navigation.js    # Navigation component
│   │   ├── register.js      # Registration page logic
│   │   ├── statistics.js    # Statistics page with charts
│   │   └── watchlist.js     # Watchlist management
│   ├── index.html           # Landing page
│   ├── movies.html          # Movies listing page
│   ├── movie-detail.html    # Movie details page
│   ├── watchlist.html       # User watchlist page
│   ├── statistics.html      # Statistics dashboard
│   ├── admin.html           # Admin panel
│   ├── login.html           # Login page
│   └── register.html        # Registration page
├── .env                     # Environment variables 
├── index.js                 # Application entry point
├── package.json             # Project dependencies & scripts
├── package-lock.json        # Locked dependency versions
└── README.md                # Project documentation
```

**Data Flow:**
1. Client sends HTTP request to Express server
2. Request passes through middleware (authentication, validation)
3. Route handler delegates to appropriate controller
4. Controller interacts with MongoDB via Mongoose models
5. Response sent back to client with JSON data
6. Frontend JavaScript updates the UI dynamically

## Database Schema

### Collections

#### 1. Users Collection
Stores user account information and authentication data.

**Schema:**
```javascript
{
  username: String (unique, 3-50 chars),
  email: String (unique, validated),
  password: String (hashed with bcrypt),
  role: String (enum: 'user', 'admin', 'moderator'),
  watchlist: [ObjectId] (references Movie),
  createdAt: Date
}
```

**Indexes:**
- Unique index on `email`
- Unique index on `username`

**Features:**
- Password hashing using bcryptjs (pre-save hook)
- JWT token generation method
- Password comparison method

#### 2. Movies Collection
Core entity storing movie information.

**Schema:**
```javascript
{
  title: String (required, max 200 chars),
  description: String (required, max 2000 chars),
  year: Number (1888 - current+5),
  director: String (required),
  cast: [String],
  ranking: Number (0-10, calculated from reviews),
  genre: [String] (enum: 21 genres),
  reviews: [ObjectId] (references Review),
  posterUrl: String,
  trailerUrl: String,
  createdBy: ObjectId (references User),
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**
- Compound index: `{ title: 1, year: -1 }`
- Compound index: `{ genre: 1, ranking: -1 }`
- Single field index: `{ director: 1 }`
- Text index: `{ title: 'text', description: 'text', director: 'text' }`

**Methods:**
- `updateRanking()`: Calculates average rating from all reviews

#### 3. Reviews Collection
Stores user reviews for movies.

**Schema:**
```javascript
{
  user: ObjectId (references User, required),
  movie: ObjectId (references Movie, required),
  username: String (denormalized for performance),
  rating: Number (1-10, required),
  comment: String (max 1000 chars, required),
  createdAt: Date
}
```

**Indexes:**
- Compound unique index: `{ movie: 1, user: 1 }` (prevents duplicate reviews)

### Data Modeling Strategy

**Referenced Documents:**
- User → Movies (watchlist)
- Movie → Reviews (array of ObjectIds)
- Movie → User (createdBy)
- Review → User and Movie

**Embedded Data:**
- Movie genres (array of strings)
- Movie cast (array of strings)
- Username in Review (denormalized for performance)

**Rationale:**
- Reviews are referenced (not embedded) to allow independent querying and prevent document size limits
- Watchlist uses references for flexibility and to avoid data duplication
- Username is denormalized in reviews to reduce joins when displaying review lists

## API Documentation

### Authentication Endpoints (`/api/auth`)

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/register` | Public | Register new user account |
| POST | `/login` | Public | Login and receive JWT token |
| GET | `/me` | Private | Get current user profile |
| GET | `/watchlist` | Private | Get user's watchlist with populated movies |
| POST | `/watchlist/:movieId` | Private | Add movie to watchlist |
| DELETE | `/watchlist/:movieId` | Private | Remove movie from watchlist |

**Example Request - Register:**
```json
POST /api/auth/register
{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "password123"
}
```

**Example Response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "username": "johndoe",
    "email": "john@example.com",
    "role": "user"
  }
}
```

### Movie Endpoints (`/api/movies`)

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/` | Public | Get all movies (with filtering, sorting, pagination) |
| GET | `/search?q={query}` | Public | Text search movies |
| GET | `/stats` | Public | Get aggregated statistics |
| GET | `/top-rated` | Public | Get top rated movies |
| GET | `/:id` | Public | Get single movie by ID |
| POST | `/` | Admin/Moderator | Create new movie |
| PUT | `/:id` | Admin/Moderator | Update movie |
| DELETE | `/:id` | Admin/Moderator | Delete movie |

**Query Parameters for GET /api/movies:**
- `genre`: Filter by genre
- `year`: Filter by year
- `director`: Filter by director (regex)
- `minRating`: Minimum rating filter
- `sortBy`: Sort field (default: createdAt)
- `order`: asc/desc (default: desc)
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)

**Example Request - Get Movies:**
```
GET /api/movies?genre=Action&minRating=7&page=1&limit=10
```

**Example Response:**
```json
{
  "success": true,
  "count": 10,
  "total": 45,
  "page": 1,
  "pages": 5,
  "data": [...]
}
```

### Review Endpoints (`/api/movies/:id/reviews`)

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/:id/reviews` | Private | Add review to movie |
| PUT | `/:id/reviews/:reviewId` | Private | Update own review |
| DELETE | `/:id/reviews/:reviewId` | Private/Admin | Delete review |

**Example Request - Add Review:**
```json
POST /api/movies/507f1f77bcf86cd799439011/reviews
Authorization: Bearer {token}
{
  "rating": 8,
  "comment": "Great movie! Highly recommended."
}
```

### User Management Endpoints (`/api/users`)

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/` | Admin | Get all users |
| DELETE | `/:id` | Admin | Delete user (with cascade) |

**Total Endpoints: 14**

## MongoDB Implementation

### CRUD Operations

**Create:**
- User registration (`User.create()`)
- Movie creation (`Movie.create()`)
- Review creation (`Review.create()`)

**Read:**
- Find with filters (`Movie.find(query)`)
- Find by ID (`Movie.findById()`)
- Population (`populate('watchlist')`, `populate('reviews')`)
- Text search (`$text`, `$search`)

**Update:**
- Update movie (`findByIdAndUpdate()` with `$set`)
- Update review (direct field assignment)
- Add to watchlist (`user.watchlist.push()`)
- Remove from watchlist (`user.watchlist.filter()`)
- Update movie ranking (calculated method)

**Delete:**
- Delete movie (`findByIdAndDelete()`)
- Delete review (`findByIdAndDelete()`)
- Delete user with cascading (`deleteMany()`, `pull()`)

### Advanced MongoDB Operators

**Update Operators:**
- `$set`: Update movie fields
- `$push`: Add movie to watchlist, add review to movie
- `$pull`: Remove review from movie array
- `$inc`: Implicit in aggregation (counting)

**Query Operators:**
- `$gte`: Minimum rating filter
- `$gt`: Greater than in aggregations
- `$regex`: Director name search
- `$text`, `$search`: Full-text search
- `$meta`: Text search scoring

**Array Operators:**
- `$size`: Count reviews in aggregation
- `$unwind`: Flatten genre arrays in aggregation

### Aggregation Pipelines

#### 1. Movie Statistics (`/api/movies/stats`)
Multi-faceted aggregation with 4 parallel pipelines:

```javascript
[
  {
    $facet: {
      // Genre statistics
      genreStats: [
        { $unwind: '$genre' },
        { $group: { _id: '$genre', count: { $sum: 1 }, avgRating: { $avg: '$ranking' } } },
        { $sort: { count: -1 } }
      ],
      // Year statistics
      yearStats: [
        { $group: { _id: '$year', count: { $sum: 1 }, avgRating: { $avg: '$ranking' } } },
        { $sort: { _id: -1 } },
        { $limit: 10 }
      ],
      // Overall statistics
      overallStats: [
        { $group: { _id: null, totalMovies: { $sum: 1 }, avgRating: { $avg: '$ranking' } } }
      ],
      // Top directors
      topDirectors: [
        { $group: { _id: '$director', movieCount: { $sum: 1 }, avgRating: { $avg: '$ranking' } } },
        { $sort: { movieCount: -1 } },
        { $limit: 10 }
      ]
    }
  }
]
```

**Stages Used:** `$facet`, `$unwind`, `$group`, `$sum`, `$avg`, `$max`, `$sort`, `$limit`, `$match`

#### 2. Top Rated Movies (`/api/movies/top-rated`)

```javascript
[
  { $match: { ranking: { $gt: 0 }, reviews: { $exists: true, $ne: [] } } },
  { $addFields: { reviewCount: { $size: '$reviews' } } },
  { $match: { reviewCount: { $gte: 1 } } },
  { $sort: { ranking: -1, reviewCount: -1 } },
  { $limit: 10 },
  { $project: { reviews: 0 } }
]
```

**Stages Used:** `$match`, `$addFields`, `$size`, `$sort`, `$limit`, `$project`

### Indexing & Optimization Strategy

**Compound Indexes:**
1. `{ title: 1, year: -1 }`: Optimizes sorting movies by title and year
2. `{ genre: 1, ranking: -1 }`: Supports genre filtering with rating sort
3. `{ movie: 1, user: 1 }`: Enforces uniqueness and speeds up review lookups

**Single Field Indexes:**
- `{ email: 1 }`: Fast user lookup by email (login)
- `{ username: 1 }`: Fast user lookup by username
- `{ director: 1 }`: Supports director filtering

**Text Index:**
- `{ title: 'text', description: 'text', director: 'text' }`: Enables full-text search

**Performance Justification:**
- Compound indexes reduce query execution time for common filter combinations
- Text index enables fast search without regex scans
- Unique indexes prevent duplicate data and provide O(log n) lookups
- Review compound index prevents duplicate reviews and optimizes user-movie queries

### Security Features

**Authentication:**
- JWT-based stateless authentication
- Password hashing with bcryptjs (salt rounds: 10)
- Token expiration (30 days)
- Protected routes via middleware

**Authorization:**
- Role-based access control (RBAC)
- Middleware checks user roles before granting access
- Three-tier permission system (user, moderator, admin)

**Data Validation:**
- Express-validator for input validation
- Mongoose schema validation
- Email format validation
- Password minimum length (6 characters)

### Cascading Deletes

When a user is deleted, the system performs manual cascading:
1. Find all reviews by the user
2. Remove review references from movies (`$pull`)
3. Recalculate movie rankings
4. Delete all review documents
5. Delete the user document

## Installation & Setup

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or Atlas)
- npm or yarn

### Installation Steps

1. **Clone the repository**
```bash
git clone https://github.com/yerkebulan111/movie-land-platform.git
cd movie-land-platform
```

2. **Install dependencies**
```bash
npm install
```

3. **Environment Configuration**
Create a `.env` file in the root directory:
```env
NODE_ENV=development
PORT=3000
MONGODB_URI=mongodb://localhost:27017/movieland
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRE=30d
```

4. **Start MongoDB**
```bash
# If using local MongoDB
mongod
```

5. **Run the application**
```bash
# Development mode (with nodemon)
npm run dev

# Production mode
npm start
```

6. **Access the application**
Open your browser and navigate to:
```
http://localhost:3000
```

### Default Admin Account
After first run, you may need to manually create an admin user via MongoDB:
```javascript
db.users.updateOne(
  { email: "admin@example.com" },
  { $set: { role: "admin" } }
)
```

## Technologies Used

**Backend:**
- **Node.js**: JavaScript runtime
- **Express.js**: Web application framework
- **MongoDB**: NoSQL database
- **Mongoose**: MongoDB ODM
- **bcryptjs**: Password hashing
- **jsonwebtoken**: JWT authentication
- **express-validator**: Input validation
- **dotenv**: Environment variable management
- **cors**: Cross-origin resource sharing

**Frontend:**
- **HTML5**: Structure
- **CSS3**: Styling
- **Vanilla JavaScript**: Client-side logic
- **Fetch API**: HTTP requests

**Development:**
- **nodemon**: Auto-restart during development

## Project Statistics

- **Total Collections**: 3 (Users, Movies, Reviews)
- **Total API Endpoints**: 14
- **Total Frontend Pages**: 8 (index, movies, movie-detail, watchlist, statistics, admin, login, register)
- **Aggregation Pipelines**: 2 multi-stage pipelines
- **Indexes**: 7 (3 compound, 3 single, 1 text)
- **Authentication Methods**: JWT with role-based authorization
- **MongoDB Operators Used**: $set, $push, $pull, $inc, $gte, $gt, $text, $search, $meta, $size, $unwind, $group, $sum, $avg, $max, $sort, $limit, $match, $facet, $addFields, $project

## Key Features

- RESTful API architecture  
- Full CRUD operations across all collections  
- Hybrid data modeling (embedded and referenced documents)  
- Advanced MongoDB operators and queries  
- Multi-stage aggregation pipelines for analytics  
- Optimized compound indexes for performance  
- Secure JWT-based authentication  
- Role-based access control (User, Moderator, Admin)  
- Centralized error handling middleware  
- Environment-based configuration  
- Advanced filtering, pagination, and sorting  
- Comprehensive input validation  
- Bcrypt password hashing  
- Cascading delete operations  
- Full-text search capabilities  

## � License

This project is open source and available under the [MIT License](LICENSE).


---

*MovieLand - Discover, Review, and Share Your Favorite Movies*
