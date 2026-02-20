--
-- PostgreSQL database dump
--

\restrict g13qZ7qNzIsX9UuRVMW58FhaTu0jXBmznXNDJARsxIdKaGhTHWUYxOniINmcLp0

-- Dumped from database version 16.11 (Homebrew)
-- Dumped by pg_dump version 18.1

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: DocumentStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."DocumentStatus" AS ENUM (
    'DRAFT',
    'PUBLISHED',
    'ARCHIVED'
);


--
-- Name: GoalType; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."GoalType" AS ENUM (
    'YEARLY',
    'QUARTERLY',
    'MONTHLY',
    'WEEKLY'
);


--
-- Name: TaskPriority; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."TaskPriority" AS ENUM (
    'LOW',
    'MEDIUM',
    'HIGH',
    'CRITICAL'
);


--
-- Name: TaskStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."TaskStatus" AS ENUM (
    'PENDING',
    'IN_PROGRESS',
    'COMPLETED',
    'SKIPPED'
);


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: AiContext; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."AiContext" (
    id text NOT NULL,
    type text NOT NULL,
    prompt text NOT NULL,
    response text NOT NULL,
    metadata jsonb,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: Document; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Document" (
    id text NOT NULL,
    title text NOT NULL,
    slug text NOT NULL,
    content text,
    status public."DocumentStatus" DEFAULT 'DRAFT'::public."DocumentStatus" NOT NULL,
    "spaceId" text NOT NULL,
    "parentId" text,
    "sortOrder" integer DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: Event; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Event" (
    id text NOT NULL,
    title text NOT NULL,
    description text,
    "eventDate" timestamp(3) without time zone NOT NULL,
    category text,
    url text,
    "goalId" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: Goal; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Goal" (
    id text NOT NULL,
    title text NOT NULL,
    description text,
    type public."GoalType" NOT NULL,
    "startDate" timestamp(3) without time zone NOT NULL,
    "endDate" timestamp(3) without time zone NOT NULL,
    progress double precision DEFAULT 0 NOT NULL,
    "parentId" text,
    category text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: ProgressSnapshot; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."ProgressSnapshot" (
    id text NOT NULL,
    date timestamp(3) without time zone NOT NULL,
    "goalId" text NOT NULL,
    progress double precision NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: Reward; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Reward" (
    id text NOT NULL,
    type text NOT NULL,
    name text NOT NULL,
    description text,
    icon text,
    "earnedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    metadata jsonb
);


--
-- Name: Space; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Space" (
    id text NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    description text,
    icon text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: Task; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Task" (
    id text NOT NULL,
    title text NOT NULL,
    description text,
    status public."TaskStatus" DEFAULT 'PENDING'::public."TaskStatus" NOT NULL,
    priority public."TaskPriority" DEFAULT 'MEDIUM'::public."TaskPriority" NOT NULL,
    "scheduledDate" timestamp(3) without time zone,
    "completedAt" timestamp(3) without time zone,
    "estimatedMinutes" integer,
    "actualMinutes" integer,
    "goalId" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: UserStats; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."UserStats" (
    id text DEFAULT 'singleton'::text NOT NULL,
    "totalPoints" integer DEFAULT 0 NOT NULL,
    "currentStreak" integer DEFAULT 0 NOT NULL,
    "longestStreak" integer DEFAULT 0 NOT NULL,
    "lastActiveDate" timestamp(3) without time zone,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: WeeklyReview; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."WeeklyReview" (
    id text NOT NULL,
    "weekStart" timestamp(3) without time zone NOT NULL,
    "weekEnd" timestamp(3) without time zone NOT NULL,
    rating integer,
    "completedTasks" integer DEFAULT 0 NOT NULL,
    "totalTasks" integer DEFAULT 0 NOT NULL,
    "studyMinutes" integer DEFAULT 0 NOT NULL,
    "userNotes" text,
    "aiAnalysis" text,
    "aiRecommendations" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


--
-- Data for Name: AiContext; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."AiContext" (id, type, prompt, response, metadata, "createdAt") FROM stdin;
cmlh485h90028p3szkiknuwlh	monthly_plan	You are an AI life planning assistant. Your job is to create a balanced, achievable monthly (4-week) plan aligned with the user's goals.\n\n## Planning Period\nFrom 2026-02-09 to 2026-03-09 (monthly (4-week) plan)\n\n## Focus Goals (prioritize these)\n- Pass Adobe Commerce Business Practitioner Expert (0% complete) [Type: QUARTERLY] [Category: certification] [ID: cmlfw505a0002p3065g2hlzgr]\n- Pass Adobe Commerce Developer Expert (0% complete) [Type: QUARTERLY] [Category: certification] [ID: cmlfw506f0004p30631yrhq8r]\n\n## Full Goal Hierarchy\n\n### Yearly Goals\n- Earn All 4 Adobe Commerce Certifications (0% complete) [Category: certification] [ID: cmlfw4zje0000p306u0phi754]\n- Improve Physical Fitness (36% complete) [Category: health] [ID: cmlfw507r000pp306qu7grx6y]\n\n### Quarterly Goals\n- Pass Adobe Commerce Architect Master (0% complete) [Category: certification] [ID: cmlfw506h0008p306t2c8ccg3]\n- Pass Adobe Commerce Business Practitioner Expert (0% complete) [Category: certification] [ID: cmlfw505a0002p3065g2hlzgr]\n- Pass Adobe Commerce Front-End Developer Expert (0% complete) [Category: certification] [ID: cmlfw506g0006p306z85hjj9c]\n- Pass Adobe Commerce Developer Expert (0% complete) [Category: certification] [ID: cmlfw506f0004p30631yrhq8r]\n\n### Monthly Goals\n- Complete Adobe Commerce Business Practitioner Study Guide (0% complete) [Category: certification] [ID: cmlfw506i000ap306qvr4cw93]\n\n## Last Week's Review\nNo review from last week\n\n## Upcoming Events (within planning period + 14 days)\n- Adobe Commerce Business Practitioner Expert Exam (AD0-E708) on 2026-02-20 (10 days away) [certification]\n- Adobe Commerce Developer Expert Exam (AD0-E725) on 2026-03-13 (31 days away) [certification]\n\n## Incomplete Tasks from Previous Periods\nNo incomplete tasks\n\n## Instructions\nCreate a monthly (4-week) plan with daily tasks from 2026-02-09 to 2026-03-09. Spread tasks across all 4 weeks. For certification exams, ramp up study intensity as exam dates approach. Include rest days and lighter weekends.\n\nIMPORTANT: The user has selected specific focus goals. Heavily prioritize tasks that advance these goals. At least 70% of tasks should relate to the focus goals.\n\nFor each task, provide:\n- title: Clear, actionable task title\n- description: Brief description (optional)\n- priority: LOW, MEDIUM, HIGH, or CRITICAL\n- scheduledDate: ISO date string (YYYY-MM-DD) — must be within 2026-02-09 to 2026-03-09\n- estimatedMinutes: Estimated time in minutes\n\nAlso provide:\n- summary: A 2-3 sentence overview of the monthly (4-week) focus\n- focusAreas: Array of 3-5 key focus areas\n\nRespond in JSON format:\n{\n  "tasks": [{ "title": "...", "description": "...", "priority": "MEDIUM", "scheduledDate": "2026-02-10", "estimatedMinutes": 60 }],\n  "summary": "...",\n  "focusAreas": ["..."]\n}	{"tasks":[{"title":"Review Adobe Commerce Business Practitioner Exam Guide","description":"Download and thoroughly review the official AD0-E708 exam guide, noting topic weights and focus areas","priority":"CRITICAL","scheduledDate":"2026-02-10","estimatedMinutes":90},{"title":"Study Business Practitioner: Product Management & Catalog","description":"Deep dive into product types, attributes, categories, and catalog management best practices","priority":"CRITICAL","scheduledDate":"2026-02-10","estimatedMinutes":120},{"title":"Study Business Practitioner: Customer Management & Segmentation","description":"Learn customer groups, segments, account structures, and B2B features","priority":"CRITICAL","scheduledDate":"2026-02-11","estimatedMinutes":120},{"title":"Study Business Practitioner: Marketing & Promotions","description":"Master price rules, cart rules, promotional strategies, and related products","priority":"CRITICAL","scheduledDate":"2026-02-11","estimatedMinutes":120},{"title":"Study Business Practitioner: Order Management & Fulfillment","description":"Cover order workflows, statuses, shipping methods, payment methods, and RMA processes","priority":"CRITICAL","scheduledDate":"2026-02-12","estimatedMinutes":120},{"title":"Study Business Practitioner: Content & Design","description":"Learn Page Builder, CMS pages, blocks, widgets, themes, and storefront customization","priority":"HIGH","scheduledDate":"2026-02-12","estimatedMinutes":90},{"title":"Study Business Practitioner: Site Configuration & Settings","description":"Master store configuration, multi-store setup, internationalization, and tax settings","priority":"CRITICAL","scheduledDate":"2026-02-13","estimatedMinutes":120},{"title":"Practice Business Practitioner Scenario Questions","description":"Work through practice scenarios focusing on business requirement analysis and solution design","priority":"CRITICAL","scheduledDate":"2026-02-13","estimatedMinutes":90},{"title":"Study Business Practitioner: SEO & Analytics","description":"Learn SEO best practices, URL rewrites, sitemaps, and Google Analytics integration","priority":"HIGH","scheduledDate":"2026-02-14","estimatedMinutes":90},{"title":"Review Business Practitioner Weak Areas","description":"Identify and focus on topics where understanding is weakest based on practice results","priority":"CRITICAL","scheduledDate":"2026-02-15","estimatedMinutes":120},{"title":"30-Minute Cardio Workout","description":"Maintain fitness routine with moderate cardio session","priority":"MEDIUM","scheduledDate":"2026-02-15","estimatedMinutes":30},{"title":"Complete Business Practitioner Practice Test 1","description":"Take full-length practice exam under timed conditions","priority":"CRITICAL","scheduledDate":"2026-02-16","estimatedMinutes":120},{"title":"Review Practice Test 1 Results & Study Gaps","description":"Analyze incorrect answers and review related topics thoroughly","priority":"CRITICAL","scheduledDate":"2026-02-17","estimatedMinutes":120},{"title":"Study Business Practitioner: Advanced Promotions","description":"Deep dive into complex promotional scenarios, bundling, and tier pricing","priority":"HIGH","scheduledDate":"2026-02-17","estimatedMinutes":90},{"title":"Study Business Practitioner: Customer Experience","description":"Focus on checkout optimization, wish lists, comparison, reviews, and loyalty programs","priority":"HIGH","scheduledDate":"2026-02-18","estimatedMinutes":90},{"title":"Complete Business Practitioner Practice Test 2","description":"Second full-length practice exam to gauge readiness","priority":"CRITICAL","scheduledDate":"2026-02-18","estimatedMinutes":120},{"title":"Final Review: Business Practitioner Key Topics","description":"Speed review of all major exam topics, formulas, and best practices","priority":"CRITICAL","scheduledDate":"2026-02-19","estimatedMinutes":180},{"title":"Light Review & Exam Prep for Business Practitioner","description":"Brief review of key concepts, ensure exam logistics are ready, rest well","priority":"CRITICAL","scheduledDate":"2026-02-20","estimatedMinutes":60},{"title":"Download Adobe Commerce Developer Exam Guide","description":"Review AD0-E725 exam guide, topic weights, and technical requirements","priority":"CRITICAL","scheduledDate":"2026-02-21","estimatedMinutes":60},{"title":"Study Developer: Architecture & Customization Techniques","description":"Learn module development, dependency injection, plugins, observers, and events","priority":"CRITICAL","scheduledDate":"2026-02-21","estimatedMinutes":150},{"title":"30-Minute Cardio Workout","description":"Maintain fitness with regular cardio session","priority":"MEDIUM","scheduledDate":"2026-02-22","estimatedMinutes":30},{"title":"Study Developer: Database & Data Management","description":"Master declarative schema, data patches, database operations, and EAV system","priority":"CRITICAL","scheduledDate":"2026-02-22","estimatedMinutes":150},{"title":"Study Developer: UI Components & Layout","description":"Learn layout XML, UI components, blocks, templates, and frontend architecture","priority":"CRITICAL","scheduledDate":"2026-02-23","estimatedMinutes":150},{"title":"Hands-On: Create Custom Module","description":"Build a simple custom module from scratch to reinforce concepts","priority":"HIGH","scheduledDate":"2026-02-24","estimatedMinutes":180},{"title":"Study Developer: API & Web Services","description":"Master REST/SOAP APIs, service contracts, and API authentication","priority":"CRITICAL","scheduledDate":"2026-02-25","estimatedMinutes":150},{"title":"Study Developer: Checkout & Payment Processing","description":"Learn checkout customization, payment gateway integration, and quote management","priority":"HIGH","scheduledDate":"2026-02-26","estimatedMinutes":120},{"title":"Study Developer: Catalog & Product Management","description":"Deep dive into product repositories, custom attributes, and inventory management","priority":"CRITICAL","scheduledDate":"2026-02-27","estimatedMinutes":150},{"title":"Hands-On: Implement Plugin and Observer","description":"Practice creating plugins and observers for common customization scenarios","priority":"HIGH","scheduledDate":"2026-02-28","estimatedMinutes":120},{"title":"Study Developer: Order Management & Workflow","description":"Learn order processing, custom order statuses, shipment, and invoice generation","priority":"HIGH","scheduledDate":"2026-03-01","estimatedMinutes":120},{"title":"30-Minute Strength Training","description":"Fitness routine with focus on strength exercises","priority":"MEDIUM","scheduledDate":"2026-03-01","estimatedMinutes":30},{"title":"Study Developer: Admin Configuration & ACL","description":"Master system.xml, ACL resources, admin grids, and forms","priority":"HIGH","scheduledDate":"2026-03-02","estimatedMinutes":120},{"title":"Study Developer: Caching & Performance","description":"Learn cache types, full page cache, Varnish, indexing, and performance optimization","priority":"CRITICAL","scheduledDate":"2026-03-03","estimatedMinutes":150},{"title":"Hands-On: Build Custom API Endpoint","description":"Create a custom REST API endpoint with proper service contracts","priority":"HIGH","scheduledDate":"2026-03-04","estimatedMinutes":150},{"title":"Study Developer: Security Best Practices","description":"Learn input validation, ACL, CSRF protection, SQL injection prevention, and XSS protection","priority":"CRITICAL","scheduledDate":"2026-03-05","estimatedMinutes":120},{"title":"Complete Developer Practice Test 1","description":"First full-length practice exam for developer certification","priority":"CRITICAL","scheduledDate":"2026-03-06","estimatedMinutes":120},{"title":"Review Developer Practice Test & Study Gaps","description":"Analyze mistakes and review weak technical areas","priority":"CRITICAL","scheduledDate":"2026-03-07","estimatedMinutes":150},{"title":"Study Developer: Testing & Debugging","description":"Learn unit testing, integration testing, MFTF, and debugging techniques","priority":"HIGH","scheduledDate":"2026-03-08","estimatedMinutes":120},{"title":"30-Minute Cardio Workout","description":"Maintain fitness routine","priority":"MEDIUM","scheduledDate":"2026-03-08","estimatedMinutes":30},{"title":"Complete Developer Practice Test 2","description":"Second practice exam to assess readiness and identify final gaps","priority":"CRITICAL","scheduledDate":"2026-03-09","estimatedMinutes":120},{"title":"Review Developer Practice Test 2 Results","description":"Final gap analysis and create focused review list for next week","priority":"CRITICAL","scheduledDate":"2026-03-09","estimatedMinutes":90}],"summary":"This intensive 4-week plan prioritizes passing both Adobe Commerce certifications. Week 1 focuses heavily on Business Practitioner exam preparation with the test on Feb 20. Following the exam, weeks 2-4 shift to Developer Expert preparation, building technical skills through study and hands-on practice, with two practice exams scheduled near the end to assess readiness for the March 13 exam.","focusAreas":["Business Practitioner exam mastery (product management, marketing, order fulfillment, site configuration)","Developer technical skills (module development, APIs, database operations, UI components)","Hands-on coding practice with custom modules, plugins, observers, and API endpoints","Practice exams and gap analysis for both certifications","Maintaining physical fitness during intensive study period"]}	{"goalIds": ["cmlfw506f0004p30631yrhq8r", "cmlfw505a0002p3065g2hlzgr"], "planEnd": "2026-03-09T02:59:59.999Z", "planStart": "2026-02-09T03:00:00.000Z", "rangeType": "monthly"}	2026-02-10 21:31:02.974
cmlv4fvqg0002p3ivac68ue5j	review	You are an AI life planning assistant reviewing a user's weekly performance.\n\n## This Week's Completed Tasks\n- Review Practice Test 1 Results & Study Gaps [Priority: CRITICAL]\n- Study Business Practitioner: Advanced Promotions [Priority: HIGH]\n- Study Business Practitioner: Customer Experience [Priority: HIGH]\n- Light Review & Exam Prep for Business Practitioner [Priority: CRITICAL]\n- Complete Business Practitioner Practice Test 2 [Priority: CRITICAL]\n- Final Review: Business Practitioner Key Topics [Priority: CRITICAL]\n\n## Incomplete Tasks\n- Study Developer: Database & Data Management [Priority: CRITICAL, Status: PENDING]\n- Study Developer: Architecture & Customization Techniques [Priority: CRITICAL, Status: PENDING]\n- Study Developer: UI Components & Layout [Priority: CRITICAL, Status: PENDING]\n- Download Adobe Commerce Developer Exam Guide [Priority: CRITICAL, Status: PENDING]\n\n## Week Statistics\n- Rating: 5/5\n- Completed: 6/10 tasks\n- Study Minutes: 180\n- User Notes: I was not able to study much the first days of the week since I've traveled. But the last 2 days I did study and today, Friday 20 I've passed my Adobe Certified Expert Business Practitioner exam!! Will need more help on planning my next weeks. Then work the plan : )\n\n## Active Goals\n- Pass Adobe Commerce Architect Master (0% complete, QUARTERLY)\n- Pass Adobe Commerce Front-End Developer Expert (0% complete, QUARTERLY)\n- Pass Adobe Commerce Developer Expert (0% complete, QUARTERLY)\n- Earn All 4 Adobe Commerce Certifications (25% complete, YEARLY)\n\n## Previous Week Reviews (last 4)\nNo previous reviews\n\n## Instructions\nProvide a thoughtful, encouraging but honest review. Include:\n- analysis: 2-3 paragraph analysis of the week\n- recommendations: Specific, actionable recommendations for next week\n- highlights: Array of 2-4 positive highlights\n- areasForImprovement: Array of 2-4 areas to improve\n\nRespond in JSON format:\n{\n  "analysis": "...",\n  "recommendations": "...",\n  "highlights": ["..."],\n  "areasForImprovement": ["..."]\n}	{"analysis":"Congratulations on passing your Adobe Certified Expert Business Practitioner exam! This is a significant milestone and represents 25% completion of your yearly goal to earn all 4 Adobe Commerce certifications. Despite travel disruptions early in the week, you demonstrated excellent focus and discipline by studying 180 minutes in the last two days and successfully passing the exam on Friday. You completed 6 out of 10 planned tasks, all of which were related to your Business Practitioner exam preparation, showing clear prioritization of your immediate goal. Your 5/5 self-rating reflects the satisfaction of achieving this important certification.\\n\\nThe incomplete tasks are all related to your next certification target - the Developer Expert exam. This is understandable given your focus on completing the Business Practitioner certification. However, as you noted, you'll need help planning your next weeks to maintain momentum. The pattern of completing 60% of tasks while achieving your primary objective shows that you can deliver results even with limited study time, but a more structured approach will be beneficial as you tackle the Developer certification, which appears to be more technically complex based on the task descriptions.","recommendations":"For next week, start with downloading the Adobe Commerce Developer Exam Guide to understand the scope and structure of your next certification. Given that you studied effectively with just 180 minutes over two days, aim for 3-4 focused study sessions of 45-60 minutes each throughout the week rather than cramming. Begin with the Database & Data Management module as it's marked CRITICAL and likely forms the foundation for other topics. Since you've just completed an intense exam week, consider scheduling one day as a lighter study day to avoid burnout while maintaining consistency. Create a specific weekly plan that accounts for any travel or commitments upfront, then protect your study time blocks.","highlights":["Successfully passed Adobe Certified Expert Business Practitioner exam - a major achievement!","Demonstrated excellent adaptability by effectively studying and passing despite travel disruptions","Completed all critical exam preparation tasks with focused effort in just 2 days","Achieved 25% of your yearly certification goal in the first quarter"],"areasForImprovement":["Begin transitioning to Developer certification preparation to maintain momentum and avoid gaps between certifications","Develop strategies for maintaining study consistency during travel weeks","Create a more detailed weekly plan that accounts for known disruptions upfront","Consider spreading study time across more days for better retention, even if sessions are shorter"]}	{"reviewId": "cmlv4fvq40001p3iv5oyshyx6"}	2026-02-20 16:45:50.056
\.


--
-- Data for Name: Document; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Document" (id, title, slug, content, status, "spaceId", "parentId", "sortOrder", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Event; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Event" (id, title, description, "eventDate", category, url, "goalId", "createdAt", "updatedAt") FROM stdin;
cmlfw508o000tp306quzjee64	Adobe Commerce Architect Master Exam (AD0-E718)	Master-level architecture certification	2026-05-01 07:00:00	certification	\N	\N	2026-02-10 00:56:53.113	2026-02-10 12:40:39.781
cmlfw507r000qp306uqufkbhm	Adobe Commerce Business Practitioner Expert Exam (AD0-E708)	First certification exam - business practitioner level	2026-02-20 07:00:00	certification	\N	\N	2026-02-10 00:56:53.08	2026-02-10 14:22:18.556
cmlfw508n000rp306oooj9xgm	Adobe Commerce Developer Expert Exam (AD0-E725)	Developer professional certification	2026-03-13 07:00:00	certification	\N	\N	2026-02-10 00:56:53.111	2026-02-10 14:22:18.556
cmlfw508o000sp306cvcbnjpc	Adobe Commerce Front-End Developer Expert Exam (AD0-E727)	Front-end developer specialization	2026-04-03 07:00:00	certification	\N	\N	2026-02-10 00:56:53.112	2026-02-10 14:22:18.556
\.


--
-- Data for Name: Goal; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Goal" (id, title, description, type, "startDate", "endDate", progress, "parentId", category, "createdAt", "updatedAt") FROM stdin;
cmlfw506i000cp306m57u287o	Complete Module 1-3 of Study Guide	Cover commerce fundamentals and catalog management	WEEKLY	2026-02-09 00:00:00	2026-02-15 00:00:00	100	cmlfw506i000ap306qvr4cw93	certification	2026-02-10 00:56:53.035	2026-02-10 17:02:45.098
cmlfw506h0008p306t2c8ccg3	Pass Adobe Commerce Architect Master	Study and pass the AD0-E718 exam	QUARTERLY	2026-04-03 00:00:00	2026-05-01 00:00:00	0	cmlfw4zje0000p306u0phi754	certification	2026-02-10 00:56:53.034	2026-02-10 17:10:08.073
cmlfw506g0006p306z85hjj9c	Pass Adobe Commerce Front-End Developer Expert	Study and pass the AD0-E727 exam	QUARTERLY	2026-03-13 00:00:00	2026-04-03 00:00:00	0	cmlfw4zje0000p306u0phi754	certification	2026-02-10 00:56:53.032	2026-02-10 17:11:17.266
cmlfw506f0004p30631yrhq8r	Pass Adobe Commerce Developer Expert	Study and pass the AD0-E717 exam	QUARTERLY	2026-02-20 00:00:00	2026-03-13 00:00:00	0	cmlfw4zje0000p306u0phi754	certification	2026-02-10 00:56:53.031	2026-02-10 17:11:54.131
cmlfw506i000ap306qvr4cw93	Complete Adobe Commerce Business Practitioner Study Guide	Work through all modules of the official study guide	MONTHLY	2026-02-01 00:00:00	2026-02-28 00:00:00	100	cmlfw505a0002p3065g2hlzgr	certification	2026-02-10 00:56:53.034	2026-02-13 13:20:27.398
cmlfw505a0002p3065g2hlzgr	Pass Adobe Commerce Business Practitioner Expert	Study and pass the AD0-E708 exam	QUARTERLY	2026-01-01 00:00:00	2026-02-20 00:00:00	100	cmlfw4zje0000p306u0phi754	certification	2026-02-10 00:56:52.99	2026-02-20 13:08:28.536
cmlfw4zje0000p306u0phi754	Earn All 4 Adobe Commerce Certifications	Complete all four Adobe Commerce certification exams by end of year	YEARLY	2026-01-01 00:00:00	2026-12-31 00:00:00	25	\N	certification	2026-02-10 00:56:52.201	2026-02-20 13:08:42.78
\.


--
-- Data for Name: ProgressSnapshot; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."ProgressSnapshot" (id, date, "goalId", progress, "createdAt") FROM stdin;
\.


--
-- Data for Name: Reward; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Reward" (id, type, name, description, icon, "earnedAt", metadata) FROM stdin;
cmlglnvjt0000p3wcsflnodvg	badge	First Step	Complete your first task	🎯	2026-02-10 12:51:23.898	{"badgeId": "first_step"}
cmluworc30000p3ivactwja3v	badge	Goal Crusher	Complete a quarterly goal	💎	2026-02-20 13:08:47.331	{"badgeId": "goal_crusher"}
cmlv4j1sg0003p3ivlb2la5kj	badge	Perfect Week	Get a 5/5 weekly rating	⭐	2026-02-20 16:48:17.873	{"badgeId": "perfect_week"}
\.


--
-- Data for Name: Space; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Space" (id, name, slug, description, icon, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Task; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Task" (id, title, description, status, priority, "scheduledDate", "completedAt", "estimatedMinutes", "actualMinutes", "goalId", "createdAt", "updatedAt") FROM stdin;
cmlfw506j000ep3060qvoh2qs	Read Module 1: Commerce Fundamentals	Cover architecture overview and deployment	COMPLETED	HIGH	2026-02-10 00:00:00	2026-02-10 12:51:22.279	90	\N	cmlfw506i000cp306m57u287o	2026-02-10 00:56:53.035	2026-02-10 21:51:44.95
cmlh485fd000bp3sz5n58ozkv	Study Business Practitioner: Product Management & Catalog	Deep dive into product types, attributes, categories, and catalog management best practices	COMPLETED	CRITICAL	2026-02-10 00:00:00	2026-02-11 15:53:07.396	120	\N	\N	2026-02-10 21:31:02.895	2026-02-11 15:53:07.414
cmlfw507o000mp306nmes5clb	Review & make flashcards for modules 1-3	\N	COMPLETED	MEDIUM	2026-02-13 00:00:00	2026-02-13 13:19:15.629	45	\N	cmlfw506i000cp306m57u287o	2026-02-10 00:56:53.076	2026-02-13 13:19:15.643
cmlfw507l000gp306f6vwa1qu	Practice Module 1 Quiz Questions	\N	COMPLETED	MEDIUM	2026-02-10 00:00:00	2026-02-10 12:51:23.889	30	\N	cmlfw506i000cp306m57u287o	2026-02-10 00:56:53.073	2026-02-10 12:51:23.994
cmlh485fc0007p3sz1qqs61o8	Study Business Practitioner: Marketing & Promotions	Master price rules, cart rules, promotional strategies, and related products	COMPLETED	CRITICAL	2026-02-11 00:00:00	2026-02-11 15:53:03.172	120	\N	\N	2026-02-10 21:31:02.895	2026-02-11 15:53:03.194
cmlh485f60002p3szqoqcndlt	Study Business Practitioner: Customer Management & Segmentation	Learn customer groups, segments, account structures, and B2B features	COMPLETED	CRITICAL	2026-02-11 00:00:00	2026-02-11 15:53:04.155	120	\N	\N	2026-02-10 21:31:02.895	2026-02-11 15:53:04.174
cmlfw507q000op306eszhcgne	Take practice exam for covered topics	\N	COMPLETED	HIGH	2026-02-14 00:00:00	2026-02-20 13:18:43.27	60	\N	cmlfw506i000cp306m57u287o	2026-02-10 00:56:53.079	2026-02-20 13:18:43.302
cmlfw507m000ip306n7ruttv2	Read Module 2: Catalog Management	Product types, attributes, and categories	COMPLETED	MEDIUM	2026-02-11 00:00:00	2026-02-10 21:29:26.619	90	\N	cmlfw506i000cp306m57u287o	2026-02-10 00:56:53.075	2026-02-10 21:29:26.655
cmlh485fj000fp3szekhdltw1	Study Developer: Catalog & Product Management	Deep dive into product repositories, custom attributes, and inventory management	PENDING	CRITICAL	2026-02-27 00:00:00	\N	150	\N	\N	2026-02-10 21:31:02.901	2026-02-10 21:31:02.901
cmlh485fi000dp3szza71hcr1	Study Developer: Checkout & Payment Processing	Learn checkout customization, payment gateway integration, and quote management	PENDING	HIGH	2026-02-26 00:00:00	\N	120	\N	\N	2026-02-10 21:31:02.901	2026-02-10 21:31:02.901
cmlh485fj000hp3sz5g7i476f	Hands-On: Implement Plugin and Observer	Practice creating plugins and observers for common customization scenarios	PENDING	HIGH	2026-02-28 00:00:00	\N	120	\N	\N	2026-02-10 21:31:02.902	2026-02-10 21:31:02.902
cmlh485fj000kp3szjs1cqejd	Study Developer: Order Management & Workflow	Learn order processing, custom order statuses, shipment, and invoice generation	PENDING	HIGH	2026-03-01 00:00:00	\N	120	\N	\N	2026-02-10 21:31:02.902	2026-02-10 21:31:02.902
cmlh485fj000lp3szgav6catc	30-Minute Strength Training	Fitness routine with focus on strength exercises	PENDING	MEDIUM	2026-03-01 00:00:00	\N	30	\N	\N	2026-02-10 21:31:02.902	2026-02-10 21:31:02.902
cmlh485fk000np3sz0js66l1r	Study Developer: Admin Configuration & ACL	Master system.xml, ACL resources, admin grids, and forms	PENDING	HIGH	2026-03-02 00:00:00	\N	120	\N	\N	2026-02-10 21:31:02.902	2026-02-10 21:31:02.902
cmlh485fk000pp3szvmeewv2s	Study Developer: Caching & Performance	Learn cache types, full page cache, Varnish, indexing, and performance optimization	PENDING	CRITICAL	2026-03-03 00:00:00	\N	150	\N	\N	2026-02-10 21:31:02.903	2026-02-10 21:31:02.903
cmlh485fm000xp3szc8tudc72	Review Developer Practice Test & Study Gaps	Analyze mistakes and review weak technical areas	PENDING	CRITICAL	2026-03-07 00:00:00	\N	150	\N	\N	2026-02-10 21:31:02.903	2026-02-10 21:31:02.903
cmlh485fl000vp3szkvcgsh4v	Complete Developer Practice Test 1	First full-length practice exam for developer certification	PENDING	CRITICAL	2026-03-06 00:00:00	\N	120	\N	\N	2026-02-10 21:31:02.903	2026-02-10 21:31:02.903
cmlh485fl000tp3szbfh9d9ln	Study Developer: Security Best Practices	Learn input validation, ACL, CSRF protection, SQL injection prevention, and XSS protection	PENDING	CRITICAL	2026-03-05 00:00:00	\N	120	\N	\N	2026-02-10 21:31:02.903	2026-02-10 21:31:02.903
cmlh485fl000rp3szsrof9gi4	Hands-On: Build Custom API Endpoint	Create a custom REST API endpoint with proper service contracts	PENDING	HIGH	2026-03-04 00:00:00	\N	150	\N	\N	2026-02-10 21:31:02.903	2026-02-10 21:31:02.903
cmlh485fn000zp3sz2vt3ch0w	Study Developer: Testing & Debugging	Learn unit testing, integration testing, MFTF, and debugging techniques	PENDING	HIGH	2026-03-08 00:00:00	\N	120	\N	\N	2026-02-10 21:31:02.904	2026-02-10 21:31:02.904
cmlh485g00013p3szj67ef8ku	Complete Developer Practice Test 2	Second practice exam to assess readiness and identify final gaps	PENDING	CRITICAL	2026-03-09 00:00:00	\N	120	\N	\N	2026-02-10 21:31:02.904	2026-02-10 21:31:02.904
cmlh485g00011p3sz5l74jvrj	30-Minute Cardio Workout	Maintain fitness routine	PENDING	MEDIUM	2026-03-08 00:00:00	\N	30	\N	\N	2026-02-10 21:31:02.904	2026-02-10 21:31:02.904
cmlh485g20015p3szju0x3k1c	Review Developer Practice Test 2 Results	Final gap analysis and create focused review list for next week	PENDING	CRITICAL	2026-03-09 00:00:00	\N	90	\N	\N	2026-02-10 21:31:02.904	2026-02-10 21:31:02.904
cmlh485g7001dp3sz17br4wzg	Review Business Practitioner Weak Areas	Identify and focus on topics where understanding is weakest based on practice results	PENDING	CRITICAL	2026-02-15 00:00:00	\N	120	\N	\N	2026-02-10 21:31:02.896	2026-02-10 21:31:02.896
cmlh485fc0009p3sz3mwrcyu6	Study Business Practitioner: Content & Design	Learn Page Builder, CMS pages, blocks, widgets, themes, and storefront customization	COMPLETED	HIGH	2026-02-12 00:00:00	2026-02-13 13:19:09.551	90	\N	\N	2026-02-10 21:31:02.895	2026-02-13 13:19:09.57
cmlh485f60003p3szaf66590v	Review Adobe Commerce Business Practitioner Exam Guide	Download and thoroughly review the official AD0-E708 exam guide, noting topic weights and focus areas	COMPLETED	CRITICAL	2026-02-10 00:00:00	2026-02-11 15:53:06.504	90	\N	\N	2026-02-10 21:31:02.894	2026-02-11 15:53:06.519
cmlh485fc0006p3sz8blgkqh3	Study Business Practitioner: Order Management & Fulfillment	Cover order workflows, statuses, shipping methods, payment methods, and RMA processes	COMPLETED	CRITICAL	2026-02-12 00:00:00	2026-02-13 13:19:05.825	120	\N	\N	2026-02-10 21:31:02.895	2026-02-13 13:19:05.884
cmlfw507n000kp306cuku2beb	Read Module 3: Merchandising & Pricing	\N	COMPLETED	HIGH	2026-02-12 00:00:00	2026-02-13 13:19:08.108	90	\N	cmlfw506i000cp306m57u287o	2026-02-10 00:56:53.075	2026-02-13 13:19:08.122
cmlh485g60017p3sz56ckaxyz	Study Business Practitioner: Site Configuration & Settings	Master store configuration, multi-store setup, internationalization, and tax settings	COMPLETED	CRITICAL	2026-02-13 00:00:00	2026-02-13 13:19:12.341	120	\N	\N	2026-02-10 21:31:02.895	2026-02-13 13:19:12.357
cmlh485g7001bp3szjuj0z9np	Practice Business Practitioner Scenario Questions	Work through practice scenarios focusing on business requirement analysis and solution design	COMPLETED	CRITICAL	2026-02-13 00:00:00	2026-02-13 13:19:13.54	90	\N	\N	2026-02-10 21:31:02.896	2026-02-13 13:19:13.559
cmlh485g7001ap3sz7sb98m04	30-Minute Cardio Workout	Maintain fitness routine with moderate cardio session	PENDING	MEDIUM	2026-02-15 00:00:00	\N	30	\N	\N	2026-02-10 21:31:02.896	2026-02-10 21:31:02.896
cmlh485ga001hp3szxds0kg7n	Review Practice Test 1 Results & Study Gaps	Analyze incorrect answers and review related topics thoroughly	COMPLETED	CRITICAL	2026-02-17 00:00:00	2026-02-18 11:21:58.472	120	\N	\N	2026-02-10 21:31:02.897	2026-02-18 11:21:58.491
cmlh485h0001rp3sz7ke27p6d	Study Developer: Database & Data Management	Master declarative schema, data patches, database operations, and EAV system	PENDING	CRITICAL	2026-02-22 00:00:00	\N	150	\N	\N	2026-02-10 21:31:02.9	2026-02-10 21:31:02.9
cmlh485h30021p3szlrvq64o8	Study Business Practitioner: Advanced Promotions	Deep dive into complex promotional scenarios, bundling, and tier pricing	COMPLETED	HIGH	2026-02-17 00:00:00	2026-02-18 11:21:59.221	90	\N	\N	2026-02-10 21:31:02.897	2026-02-18 11:21:59.241
cmlh485ge001jp3sz5akcgl0e	Study Business Practitioner: Customer Experience	Focus on checkout optimization, wish lists, comparison, reviews, and loyalty programs	COMPLETED	HIGH	2026-02-18 00:00:00	2026-02-18 11:22:02.554	90	\N	\N	2026-02-10 21:31:02.897	2026-02-18 11:22:02.571
cmlh485gy001pp3szuyh0l8dv	Light Review & Exam Prep for Business Practitioner	Brief review of key concepts, ensure exam logistics are ready, rest well	COMPLETED	CRITICAL	2026-02-20 00:00:00	2026-02-19 17:40:56.535	60	\N	\N	2026-02-10 21:31:02.898	2026-02-19 17:40:56.57
cmlh485h50027p3szmlmpo3bg	Study Developer: Architecture & Customization Techniques	Learn module development, dependency injection, plugins, observers, and events	PENDING	CRITICAL	2026-02-21 00:00:00	\N	90	\N	\N	2026-02-10 21:31:02.899	2026-02-19 17:41:33.197
cmlh485g9001fp3sz8uqr0nx5	Complete Business Practitioner Practice Test 1	Take full-length practice exam under timed conditions	PENDING	CRITICAL	2026-02-16 00:00:00	\N	120	\N	\N	2026-02-10 21:31:02.897	2026-02-10 21:31:02.897
cmlh485h0001tp3sze73bgys2	Study Developer: UI Components & Layout	Learn layout XML, UI components, blocks, templates, and frontend architecture	PENDING	CRITICAL	2026-02-23 00:00:00	\N	150	\N	\N	2026-02-10 21:31:02.9	2026-02-10 21:31:02.9
cmlh485h1001zp3szgyjmiloj	Study Developer: API & Web Services	Master REST/SOAP APIs, service contracts, and API authentication	PENDING	CRITICAL	2026-02-25 00:00:00	\N	150	\N	\N	2026-02-10 21:31:02.901	2026-02-10 21:31:02.901
cmlh485h50025p3szs6fgu9ri	Study Business Practitioner: SEO & Analytics	Learn SEO best practices, URL rewrites, sitemaps, and Google Analytics integration	PENDING	HIGH	2026-02-14 00:00:00	\N	90	\N	\N	2026-02-10 21:31:02.896	2026-02-10 21:31:02.896
cmlh485h1001vp3szkqp3fbui	Hands-On: Create Custom Module	Build a simple custom module from scratch to reinforce concepts	PENDING	HIGH	2026-02-24 00:00:00	\N	180	\N	\N	2026-02-10 21:31:02.9	2026-02-10 21:31:02.9
cmlh485h1001xp3sziaua13os	Download Adobe Commerce Developer Exam Guide	Review AD0-E725 exam guide, topic weights, and technical requirements	PENDING	CRITICAL	2026-02-21 00:00:00	\N	60	\N	\N	2026-02-10 21:31:02.899	2026-02-10 21:31:02.899
cmlh485gg001lp3szp3slkv2h	Complete Business Practitioner Practice Test 2	Second full-length practice exam to gauge readiness	COMPLETED	CRITICAL	2026-02-18 00:00:00	2026-02-18 11:22:01.874	120	\N	\N	2026-02-10 21:31:02.898	2026-02-18 11:22:01.895
cmlh485h40023p3sz0b6f6m2l	Final Review: Business Practitioner Key Topics	Speed review of all major exam topics, formulas, and best practices	COMPLETED	CRITICAL	2026-02-19 00:00:00	2026-02-19 17:40:58.876	180	\N	\N	2026-02-10 21:31:02.898	2026-02-19 17:40:58.89
\.


--
-- Data for Name: UserStats; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."UserStats" (id, "totalPoints", "currentStreak", "longestStreak", "lastActiveDate", "updatedAt") FROM stdin;
singleton	450	3	3	2026-02-20 03:00:00	2026-02-20 13:18:43.283
\.


--
-- Data for Name: WeeklyReview; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."WeeklyReview" (id, "weekStart", "weekEnd", rating, "completedTasks", "totalTasks", "studyMinutes", "userNotes", "aiAnalysis", "aiRecommendations", "createdAt") FROM stdin;
cmlv4fvq40001p3iv5oyshyx6	2026-02-16 03:00:00	2026-02-23 02:59:59.999	5	6	10	180	I was not able to study much the first days of the week since I've traveled. But the last 2 days I did study and today, Friday 20 I've passed my Adobe Certified Expert Business Practitioner exam!! Will need more help on planning my next weeks. Then work the plan : )	Congratulations on passing your Adobe Certified Expert Business Practitioner exam! This is a significant milestone and represents 25% completion of your yearly goal to earn all 4 Adobe Commerce certifications. Despite travel disruptions early in the week, you demonstrated excellent focus and discipline by studying 180 minutes in the last two days and successfully passing the exam on Friday. You completed 6 out of 10 planned tasks, all of which were related to your Business Practitioner exam preparation, showing clear prioritization of your immediate goal. Your 5/5 self-rating reflects the satisfaction of achieving this important certification.\n\nThe incomplete tasks are all related to your next certification target - the Developer Expert exam. This is understandable given your focus on completing the Business Practitioner certification. However, as you noted, you'll need help planning your next weeks to maintain momentum. The pattern of completing 60% of tasks while achieving your primary objective shows that you can deliver results even with limited study time, but a more structured approach will be beneficial as you tackle the Developer certification, which appears to be more technically complex based on the task descriptions.	For next week, start with downloading the Adobe Commerce Developer Exam Guide to understand the scope and structure of your next certification. Given that you studied effectively with just 180 minutes over two days, aim for 3-4 focused study sessions of 45-60 minutes each throughout the week rather than cramming. Begin with the Database & Data Management module as it's marked CRITICAL and likely forms the foundation for other topics. Since you've just completed an intense exam week, consider scheduling one day as a lighter study day to avoid burnout while maintaining consistency. Create a specific weekly plan that accounts for any travel or commitments upfront, then protect your study time blocks.	2026-02-20 16:45:50.043
\.


--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
cc4bcfa9-2e0e-4109-bbf9-ca16e408c389	5e52c5defc041a4d99eac95ce3a1bc25cf90d870cbb18972f4ad3c922f382a8b	2026-02-09 15:32:48.00336-03	20260209183247_init	\N	\N	2026-02-09 15:32:47.977784-03	1
\.


--
-- Name: AiContext AiContext_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."AiContext"
    ADD CONSTRAINT "AiContext_pkey" PRIMARY KEY (id);


--
-- Name: Document Document_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Document"
    ADD CONSTRAINT "Document_pkey" PRIMARY KEY (id);


--
-- Name: Event Event_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Event"
    ADD CONSTRAINT "Event_pkey" PRIMARY KEY (id);


--
-- Name: Goal Goal_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Goal"
    ADD CONSTRAINT "Goal_pkey" PRIMARY KEY (id);


--
-- Name: ProgressSnapshot ProgressSnapshot_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ProgressSnapshot"
    ADD CONSTRAINT "ProgressSnapshot_pkey" PRIMARY KEY (id);


--
-- Name: Reward Reward_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Reward"
    ADD CONSTRAINT "Reward_pkey" PRIMARY KEY (id);


--
-- Name: Space Space_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Space"
    ADD CONSTRAINT "Space_pkey" PRIMARY KEY (id);


--
-- Name: Task Task_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Task"
    ADD CONSTRAINT "Task_pkey" PRIMARY KEY (id);


--
-- Name: UserStats UserStats_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."UserStats"
    ADD CONSTRAINT "UserStats_pkey" PRIMARY KEY (id);


--
-- Name: WeeklyReview WeeklyReview_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."WeeklyReview"
    ADD CONSTRAINT "WeeklyReview_pkey" PRIMARY KEY (id);


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: Document_spaceId_parentId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Document_spaceId_parentId_idx" ON public."Document" USING btree ("spaceId", "parentId");


--
-- Name: Document_spaceId_slug_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Document_spaceId_slug_key" ON public."Document" USING btree ("spaceId", slug);


--
-- Name: Space_slug_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Space_slug_key" ON public."Space" USING btree (slug);


--
-- Name: Document Document_parentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Document"
    ADD CONSTRAINT "Document_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES public."Document"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Document Document_spaceId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Document"
    ADD CONSTRAINT "Document_spaceId_fkey" FOREIGN KEY ("spaceId") REFERENCES public."Space"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Goal Goal_parentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Goal"
    ADD CONSTRAINT "Goal_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES public."Goal"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Task Task_goalId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Task"
    ADD CONSTRAINT "Task_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES public."Goal"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- PostgreSQL database dump complete
--

\unrestrict g13qZ7qNzIsX9UuRVMW58FhaTu0jXBmznXNDJARsxIdKaGhTHWUYxOniINmcLp0

