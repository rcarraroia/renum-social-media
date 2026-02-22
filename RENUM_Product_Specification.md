# RENUM Social AI - Product Requirements Document

## Product Overview

**Product Name:** RENUM Social AI  
**Version:** 1.0  
**Type:** Web Application (SaaS)  
**Target Users:** Content creators, influencers, coaches, consultants, and professionals who need to automate social media content creation

## Product Description

RENUM Social AI is an AI-powered platform that automates the entire social media content creation workflow, from script generation to video production with AI avatars and automated posting across multiple platforms.

## Core Features

### 1. User Authentication & Onboarding
- **Login/Registration:** Email-based authentication via Supabase Auth
- **Onboarding Flow:** 3-step wizard to configure user profile and professional context
- **Plan Selection:** Free, Starter, and Pro tiers with different feature access

### 2. Module 1 - ScriptAI (Content Generation)
- **AI Script Generation:** Generate social media scripts based on theme and target audience
- **Audience Targeting:** Support for multiple audience types (MLM, coaches, consultants, etc.)
- **Script Editing:** In-app editor to refine generated scripts
- **Export Options:** Save scripts for use in other modules

### 3. Module 2 - PostRápido (Quick Posting)
- **Video Upload:** Support for video file uploads
- **Caption Generation:** AI-powered caption creation
- **Platform Selection:** Multi-platform posting (Instagram, TikTok, Facebook, LinkedIn, YouTube)
- **Scheduling:** Schedule posts for optimal engagement times

### 4. Module 3 - AvatarAI (AI Video Generation)
- **HeyGen Integration:** Create videos with AI avatars
- **Avatar Selection:** Choose from public avatars or create custom clones
- **Voice Selection:** Multiple voice options with preview
- **Video Configuration:** Aspect ratio selection (16:9, 9:16, 1:1, 4:5)
- **Platform Optimization:** Automatic video formatting for each platform

### 5. Calendar & Analytics
- **Content Calendar:** Visual calendar showing scheduled posts
- **Analytics Dashboard:** Track performance metrics across platforms
- **Engagement Metrics:** Views, likes, comments, shares per post

### 6. Settings & Integrations
- **Profile Management:** Update user information and preferences
- **Plan Management:** Upgrade/downgrade subscription plans
- **HeyGen Configuration:** API key setup and avatar/voice selection
- **Metricool Integration:** Connect social media accounts for posting

## Technical Architecture

### Frontend
- **Framework:** React 18 with TypeScript
- **Routing:** React Router v6
- **State Management:** Zustand
- **UI Components:** shadcn/ui with Radix UI primitives
- **Styling:** Tailwind CSS with custom design system
- **Build Tool:** Vite

### Backend
- **Framework:** FastAPI (Python)
- **Database:** PostgreSQL via Supabase
- **Authentication:** Supabase Auth with JWT
- **File Storage:** Supabase Storage
- **API Architecture:** RESTful API with async/await

### External Integrations
- **HeyGen API:** AI avatar video generation
- **Metricool API:** Social media posting and analytics
- **OpenAI API:** Script generation and content optimization

## User Flows

### Primary User Flow - Create AI Avatar Video
1. User logs in to dashboard
2. Navigates to Module 3 (AvatarAI)
3. If first time: Completes HeyGen setup wizard
   - Step 1: Validates HeyGen API Key
   - Step 2: Selects avatar and voice
4. Enters video script or imports from ScriptAI
5. Configures video settings (aspect ratio, platforms)
6. Reviews and approves configuration
7. System generates video via HeyGen API
8. User can schedule or post immediately

### Secondary User Flow - Generate Script
1. User navigates to Module 1 (ScriptAI)
2. Enters theme/topic
3. Selects target audience
4. AI generates script
5. User edits and refines
6. Exports to AvatarAI or saves for later

## Authentication & Authorization

### Login Credentials (Test Account)
- **Email:** rcarrarocoach@gmail.com
- **Password:** M&151173c@

### User Roles
- **Owner:** Full access to all features
- **Admin:** Manage users and settings
- **Member:** Limited access based on plan

### Plan Restrictions
- **Free:** Limited to Module 1 only
- **Starter:** Access to Modules 1 and 2
- **Pro:** Full access to all modules including AvatarAI

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/logout` - User logout

### HeyGen Integration
- `POST /api/integrations/heygen/validate-key` - Validate API key
- `POST /api/integrations/heygen/wizard/avatars` - List avatars (wizard)
- `POST /api/integrations/heygen/wizard/voices` - List voices (wizard)
- `PUT /api/integrations/heygen` - Save configuration
- `GET /api/integrations/heygen/credits` - Get remaining credits

### Video Generation
- `POST /api/videos/generate` - Generate AI avatar video
- `GET /api/videos/{id}/status` - Check video generation status
- `GET /api/videos` - List user videos

## Database Schema

### Key Tables
- **users:** User accounts and profiles
- **organizations:** Organization/workspace data
- **videos:** Generated videos and metadata
- **posts:** Scheduled and published posts
- **api_logs:** API call tracking and debugging

### HeyGen Configuration (in organizations table)
- `heygen_api_key` (encrypted)
- `heygen_avatar_id`
- `heygen_voice_id`
- `heygen_credits_total`
- `heygen_credits_used`

## Deployment

### Frontend (Production)
- **Platform:** Vercel
- **URL:** https://renum-post.vercel.app
- **Environment:** Production
- **Login Page:** https://renum-post.vercel.app/login

### Backend (Production)
- **Platform:** Easypanel (Docker)
- **URL:** https://renum-influency-app.wpjtfd.easypanel.host
- **Port:** 8000 (internal)
- **API Base URL:** https://renum-influency-app.wpjtfd.easypanel.host/api

### Database
- **Platform:** Supabase (Hosted PostgreSQL)
- **Project ID:** zbsbfhmsgrlohxdxihaw

## Testing Configuration

### For Production Testing (Recommended)
Use these settings in TestSprite:

- **Testing Type:** Frontend
- **Scope:** Code diff (test only recent changes)
- **Test Account Username:** rcarrarocoach@gmail.com
- **Test Account Password:** M&151173c@
- **Base URL:** https://renum-post.vercel.app
- **Path:** /login
- **Mode:** Production (no local server needed)

### For Local Development Testing (Optional)
Only use if testing locally:

- **Local Server Port:** 5173
- **Path:** /login
- **Note:** Requires `npm run dev` running locally

## Testing Requirements

### Frontend Testing
- **Login Flow:** Verify authentication works correctly
- **Navigation:** Test all module navigation
- **HeyGen Wizard:** Complete setup flow end-to-end
- **Video Configuration:** Test aspect ratio and platform selection
- **Responsive Design:** Test on mobile, tablet, and desktop

### Backend Testing
- **API Authentication:** Verify JWT token validation
- **HeyGen Integration:** Test API key validation and avatar/voice listing
- **Video Generation:** Test complete video creation workflow
- **Error Handling:** Verify proper error messages and status codes

### Integration Testing
- **End-to-End Flow:** Login → Configure HeyGen → Generate Video → Schedule Post
- **Cross-Module:** Test data flow between ScriptAI and AvatarAI
- **External APIs:** Verify HeyGen and Metricool integrations

## Success Criteria

### Functional Requirements
- ✅ User can login and access dashboard
- ✅ User can complete HeyGen setup wizard
- ✅ User can select avatar and voice
- ✅ User can generate AI avatar video
- ✅ Video generation completes successfully
- ✅ User can schedule posts to social media

### Performance Requirements
- API response time < 2 seconds
- Video generation time < 5 minutes
- Page load time < 3 seconds
- Zero critical security vulnerabilities

### User Experience Requirements
- Intuitive navigation between modules
- Clear error messages and guidance
- Responsive design on all devices
- Consistent design system throughout

## Known Issues & Limitations

### Current Issues
1. HeyGen configuration not persisting to database after wizard completion
2. Avatar/voice selection resets when navigating away from page
3. Need to verify backend deployment has latest code changes

### Planned Improvements
1. Add video preview before generation
2. Implement batch video generation
3. Add template library for common content types
4. Enhance analytics with more detailed metrics

## Support & Documentation

### User Documentation
- In-app tooltips and help text
- Video tutorials for each module
- FAQ section in settings

### Developer Documentation
- API documentation (OpenAPI/Swagger)
- Database schema diagrams
- Deployment guides

---

**Document Version:** 1.0  
**Last Updated:** February 22, 2026  
**Author:** RENUM Development Team
