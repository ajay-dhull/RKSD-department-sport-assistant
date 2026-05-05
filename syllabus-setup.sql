-- =====================================================
-- BSC Physical Education Syllabus Setup
-- Kurukshetra University - NEP 2020 Curriculum
-- Run this in Supabase SQL Editor
-- =====================================================

-- Table: syllabus_courses
CREATE TABLE IF NOT EXISTS syllabus_courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  semester text NOT NULL,
  course_code text UNIQUE NOT NULL,
  course_name text NOT NULL,
  course_type text NOT NULL,
  theory_credits integer NOT NULL DEFAULT 0,
  practical_credits integer NOT NULL DEFAULT 0,
  total_credits integer NOT NULL DEFAULT 0,
  contact_hours integer NOT NULL DEFAULT 0,
  max_marks integer NOT NULL DEFAULT 100,
  created_at timestamp with time zone DEFAULT now()
);

-- Table: course_content
CREATE TABLE IF NOT EXISTS course_content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_code text NOT NULL,
  section_type text NOT NULL, -- 'theory_unit' or 'practical_unit'
  unit_number text NOT NULL,
  unit_title text NOT NULL,
  topics text NOT NULL,
  marks integer,
  contact_hours integer,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE syllabus_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_content ENABLE ROW LEVEL SECURITY;

-- Policies: public read
DO $$ BEGIN
  CREATE POLICY "syllabus_courses_public_read" ON syllabus_courses FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE POLICY "course_content_public_read" ON course_content FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Policies: authenticated full access
DO $$ BEGIN
  CREATE POLICY "syllabus_courses_auth_all" ON syllabus_courses FOR ALL USING (auth.role() = 'authenticated');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE POLICY "course_content_auth_all" ON course_content FOR ALL USING (auth.role() = 'authenticated');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- =====================================================
-- INSERT COURSES DATA (24 Courses, 6 Semesters)
-- =====================================================

INSERT INTO syllabus_courses (semester, course_code, course_name, course_type, theory_credits, practical_credits, total_credits, contact_hours, max_marks) VALUES
-- SEMESTER 1
('1', '23-BPE-101', 'History and Foundation of Physical Education', 'Core Course - 1', 3, 1, 4, 5, 100),
('1', '23-BPE-102', 'Health Education', 'Core Course - 2', 3, 1, 4, 5, 100),
('1', '23-BPE-103', 'Basic Anatomy and Physiology', 'Core Course - 3', 3, 1, 4, 5, 100),
('1', '23-BPE-104', 'Olympic Movement', 'Minor Core Course - 1', 2, 0, 2, 2, 50),
-- SEMESTER 2
('2', '23-BPE-201', 'Exercise Physiology', 'Core Course - 4', 3, 1, 4, 5, 100),
('2', '23-BPE-202', 'Fundamentals of Sports Medicine', 'Core Course - 5', 3, 1, 4, 5, 100),
('2', '23-BPE-203', 'Officiating and Coaching', 'Core Course - 6', 3, 1, 4, 5, 100),
('2', '23-BPE-204', 'Asian and Commonwealth Games', 'Minor Core Course - 2', 2, 0, 2, 2, 50),
-- SEMESTER 3
('3', '23-BPE-301', 'Sports Psychology', 'Core Course - 7', 3, 1, 4, 5, 100),
('3', '23-BPE-302', 'Sports Nutrition', 'Core Course - 8', 3, 1, 4, 5, 100),
('3', '23-BPE-303', 'Fundamentals of Sports Training', 'Core Course - 9', 3, 1, 4, 5, 100),
('3', '23-BPE-304', 'Athletic Track and Field Events', 'Minor Core Course - 3', 3, 1, 4, 5, 100),
-- SEMESTER 4
('4', '23-BPE-401', 'Physical Fitness and Wellness', 'Core Course - 10', 3, 1, 4, 5, 100),
('4', '23-BPE-402', 'Sports Sociology', 'Core Course - 11', 3, 1, 4, 5, 100),
('4', '23-BPE-403', 'Organization and Administration', 'Core Course - 12', 3, 1, 4, 5, 100),
-- SEMESTER 5
('5', '23-BPE-501', 'Sports Journalism', 'Core Course - 13', 3, 1, 4, 5, 100),
('5', '23-BPE-502', 'Kinesiology', 'Core Course - 14', 3, 1, 4, 5, 100),
('5', '23-BPE-503', 'Sports Management', 'Core Course - 15', 3, 1, 4, 5, 100),
('5', '23-BPE-504', 'Stress Management', 'Minor Core Course - 5', 3, 1, 4, 5, 100),
-- SEMESTER 6
('6', '23-BPE-601', 'Test, Measurement and Evaluation in Physical Education', 'Core Course - 16', 3, 1, 4, 5, 100),
('6', '23-BPE-602', 'Biomechanics', 'Core Course - 17', 3, 1, 4, 5, 100),
('6', '23-BPE-603', 'Curriculum Design in Physical Education', 'Core Course - 18', 3, 1, 4, 5, 100),
('6', '23-BPE-604', 'Posture and Athletic Care', 'Minor Core Course - 6', 3, 1, 4, 5, 100),
('6', '23-BPE-605', 'Adapted Physical Education', 'Minor Core Course - 7', 3, 1, 4, 5, 100)
ON CONFLICT (course_code) DO NOTHING;

-- =====================================================
-- INSERT COURSE CONTENT
-- =====================================================

-- ===== 23-BPE-101: History and Foundation of Physical Education =====
INSERT INTO course_content (course_code, section_type, unit_number, unit_title, topics, contact_hours) VALUES
('23-BPE-101', 'theory_unit', 'I', 'Introduction of Physical Education',
'Meaning and definition of Physical Education; Relationship of Physical Education with Health and General Education; Aim and Objectives of Physical Education; Scope of Physical Education; Need of Physical Education in modern society; Misconceptions regarding Physical Education; Physical Education as Arts or Science', 12),
('23-BPE-101', 'theory_unit', 'II', 'History of Physical Education in India',
'Physical Education during Indus Valley Civilization (3250 BC – 2500 BC); Physical Education during Vedic period (2500 BC – 600 BC); Physical Education during Early Hindu Period (600 BC – 320 A.D); Physical Education during Later Hindu Period (320 A.D – 1000 A.D); Physical Education during Medieval Period (1000 A.D – 1757 A.D); Physical Education during British Period (Till 1947); Physical Education after Independence', 12),
('23-BPE-101', 'theory_unit', 'III', 'Biological Basis of Physical Education',
'Meaning of Growth and Development; Meaning of Chronological Age, Anatomical age, Physiological age and Mental age; Principles of Growth and development; Difference between Growth and development; Factors affecting Growth and development; Growth and Development at various Levels of Childhood: Pre-Adolescence – Adolescence – Adulthood', 11),
('23-BPE-101', 'theory_unit', 'IV', 'Career Opportunities in Physical Education and Sports',
'Qualifications and responsibilities of Physical Education professionals at various levels of educational institutions; Qualifications and responsibilities as Coach, Fitness Trainers, Yoga Instructors and others; Qualifications as sports Event Managers, Technical Officials, Researchers; Qualifications in Health Clubs, Fitness Centers, Aerobics, Dance & Recreation Clubs; Qualifications as Sports Journalists, Commentators, Sports Photographers and Video Analysts; Career opportunities in Central Govt, State Govt., Private Organizations; Career opportunities in Manufacturing and Marketing sectors; Entrepreneurship opportunities', 10);

INSERT INTO course_content (course_code, section_type, unit_number, unit_title, topics, marks, contact_hours) VALUES
('23-BPE-101', 'practical_unit', 'I', 'Kho-Kho',
'Court specifications, general rules and basic skills of Kho-Kho', 15, 15),
('23-BPE-101', 'practical_unit', 'II', 'Badminton',
'Court specifications, general rules and basic skills of Badminton', 15, 15);

-- ===== 23-BPE-102: Health Education =====
INSERT INTO course_content (course_code, section_type, unit_number, unit_title, topics, contact_hours) VALUES
('23-BPE-102', 'theory_unit', 'I', 'Introduction of Health and Health Education',
'Meaning and definition of Health; Meaning and definition of Health Education; Objectives of Health Education; Dimensions of Health Education; Scope of Health Education; Principles of Health Education; Need of Health Education in modern society', 12),
('23-BPE-102', 'theory_unit', 'II', 'Occupational Health',
'Meaning and definition of Occupational Health; Scope of Occupational Health; Principles of Occupational Health; Factors responsible for Occupational Health Hazards: Physical Hazards, Chemical Hazards, Biological Hazards, Mechanical Hazards, Psycho-Social Hazards; Occupational diseases caused by Physical and Chemical factors', 10),
('23-BPE-102', 'theory_unit', 'III', 'Communicable Diseases',
'Meaning of Communicable Diseases; Name of various Communicable Diseases; Meaning, Causes, symptoms and Treatment of HIV/AIDS; Meaning, Causes, symptoms and Treatment of Hepatitis A, B and C; Meaning, Causes, symptoms and Treatment of Tuberculosis and Chicken Pox; Meaning, Causes, symptoms and Treatment of COVID-19', 12),
('23-BPE-102', 'theory_unit', 'IV', 'Non-Communicable Diseases',
'Meaning of Non-Communicable Diseases; Name of various Non-Communicable Diseases; Meaning, Causes, symptoms and Treatment of various types of cardiovascular disease; Meaning, Causes, symptoms and Treatment of Typhoid and ADHD; Meaning, Causes, symptoms and Treatment of Type I and Type II Diabetes; Meaning, Causes, symptoms and Treatment of Arthritis', 11);

INSERT INTO course_content (course_code, section_type, unit_number, unit_title, topics, marks, contact_hours) VALUES
('23-BPE-102', 'practical_unit', 'I', 'BMI Calculation',
'Calculation of BMI, Categories of BMI', 5, 7),
('23-BPE-102', 'practical_unit', 'II', 'Peak Expiratory Flow',
'Calculation of Peak Expiratory Flow with Spirometer, Analysis of Peak Expiratory Flow', 5, 8),
('23-BPE-102', 'practical_unit', 'III', 'Pulse Rate and Blood Pressure',
'Measurement of Pulse Rate and Blood Pressure', 5, 7),
('23-BPE-102', 'practical_unit', 'IV', 'Oxygen Saturation Level',
'Measurement of Oxygen Saturation level, its interpretation', 5, 8);

-- ===== 23-BPE-103: Basic Anatomy and Physiology =====
INSERT INTO course_content (course_code, section_type, unit_number, unit_title, topics, contact_hours) VALUES
('23-BPE-103', 'theory_unit', 'I', 'Introduction of Anatomy and Physiology',
'Meaning and Definition of Anatomy and Physiology; Importance of Anatomy and Physiology in Physical Education and sports; Cell: Structure, Properties and functions; Meaning of Cell, Tissues, Organs and System; Bone: Meaning and types; Skeletal System: Structure and functions; Axial and Appendicular Skeleton', 12),
('23-BPE-103', 'theory_unit', 'II', 'Joints and Muscular System',
'Meaning of Joints, Types of Joints; Types of Synovial Joints present in human body; Meaning of Muscle, Types of muscles present in human body; Gross Structure of Skeletal Muscle; Structural Classification of Skeletal muscles', 11),
('23-BPE-103', 'theory_unit', 'III', 'Circulatory System and Digestive System',
'Constituents of blood and Function of blood; Structure of the heart; Types of Blood Circulation: Systemic, Pulmonary and Coronary; Organs of Digestive System; Structure and functions of the digestive system; Process of Food absorption, Name and functions of various digestive juices and enzymes', 12),
('23-BPE-103', 'theory_unit', 'IV', 'Respiratory System and Excretory System',
'Organs of Respiratory system and their functions; Structure of Respiratory system; Exchange of gases in the lungs and tissues; Organs of Excretory System: kidneys and skin; Parts and Functions of the urinary system; Structure and functions of Skin', 10);

INSERT INTO course_content (course_code, section_type, unit_number, unit_title, topics, marks, contact_hours) VALUES
('23-BPE-103', 'practical_unit', 'I', 'Human Bones Identification',
'Identification of Name and location of Human Bones on Skeleton and Chart', 10, 10),
('23-BPE-103', 'practical_unit', 'II', 'Major Muscles Identification',
'Identification of Name and location of Major Muscles of Human Body on Model and Chart', 10, 10),
('23-BPE-103', 'practical_unit', 'III', 'Organs Identification',
'Identification of Name and Location of organs of various systems: Circulatory, Digestive, Respiratory and Excretory on Models and Charts', 10, 10);

-- ===== 23-BPE-104: Olympic Movement (Theory Only) =====
INSERT INTO course_content (course_code, section_type, unit_number, unit_title, topics, contact_hours) VALUES
('23-BPE-104', 'theory_unit', 'I', 'Origin of Olympic Movement',
'Philosophy of Olympic movement; The significant stages in the development of the Ancient Olympic movement; Politics and Religion of Ancient Olympics, Opening ceremony, Different Events, Participants, Prizes for winners; Decline and Termination of the ancient Olympics', 10),
('23-BPE-104', 'theory_unit', 'II', 'Modern Olympic Games',
'Revival of Olympic Games; Olympic Symbols: Motto, Rings, Flag, Medals, Flame, Torch Relay and Anthem; Opening ceremony, Closing ceremony, medal ceremony; Olympic Protocol for member countries; Indian Performance in Modern Olympics', 10),
('23-BPE-104', 'theory_unit', 'III', 'Different Olympic Games',
'Paralympics Games: Brief History and symbols, its relation with other Olympics; Winter Olympics: Brief History and symbols, its relation with other Olympics; Youth Olympic Games: Brief History and symbols, its relation with other Olympics; Indian Performance in Modern Paralympics, Winter and Youth Olympics', 10);

-- ===== 23-BPE-201: Exercise Physiology =====
INSERT INTO course_content (course_code, section_type, unit_number, unit_title, topics, contact_hours) VALUES
('23-BPE-201', 'theory_unit', 'I', 'Introduction of Exercise Physiology and Energy Production',
'Meaning, Definition and Origins of Exercise Physiology; Scope and Importance of Exercise Physiology in Physical Education and Sports; Meaning of Anabolism, Catabolism and Metabolism; ATP-PC or Phosphate system, Anaerobic metabolism, Aerobic Metabolism; Aerobic and Anaerobic energy Systems during Rest and Exercise', 11),
('23-BPE-201', 'theory_unit', 'II', 'Exercise and Muscular System',
'Macro & Micro Structure of Skeletal Muscle; Chemical Composition of Skeletal Muscle; Types and Characteristic of muscle fiber; Meaning of Motor Unit, Muscle Hypertrophy and Atrophy, Muscle Tone, Lactate threshold and Muscle Fatigue; Effects of exercise on muscular system', 12),
('23-BPE-201', 'theory_unit', 'III', 'Exercise and Circulatory System',
'Conduction System of the Heart; Blood Supply to the Heart, Cardiac Cycle; Meaning of Stroke Volume, Cardiac Output, Heart Rate, Blood Pressure, Cardiac Reserve Capacity, Bradycardia, Tachycardia; Factors Affecting Heart Rate; Effect of exercises and training on the Circulatory system', 12),
('23-BPE-201', 'theory_unit', 'IV', 'Exercise and Respiratory System',
'Mechanics of Breathing during rest and exercise; Nervous control of Respiration; Role of Various Respiratory muscles in Breathing; Meaning of Total Lungs Capacity, Ventilation Capacity, Inspiration Reserve Capacity, Expiration Reserve Capacity, Tidal Volume, Residual Volume, Oxygen debt, VO2 Max; Effect of exercises and training on the respiratory system', 11);

INSERT INTO course_content (course_code, section_type, unit_number, unit_title, topics, marks, contact_hours) VALUES
('23-BPE-201', 'practical_unit', 'I', 'Blood Lactate and Ventilation Capacity',
'Techniques of Measuring Blood Lactate level before and after exercise; Technique of Measuring Ventilation Capacity', 15, 15),
('23-BPE-201', 'practical_unit', 'II', 'VO2 Max and ECG',
'Technique of calculation VO2 Max; Basic Interpretation of ECG', 15, 15);

-- ===== 23-BPE-202: Fundamentals of Sports Medicine =====
INSERT INTO course_content (course_code, section_type, unit_number, unit_title, topics, contact_hours) VALUES
('23-BPE-202', 'theory_unit', 'I', 'Introduction of Sports Medicine',
'Sports Medicine: Meaning, Aims, Objectives, Modern Concepts and Importance; Brief history of Sports Medicine in India and Abroad; Qualifications of Sports Medicine Personals, Career opportunities; Meaning, Aims, Objectives and Principles of First Aid; First Aid for Burning, Electric shock, Snake Bite, Fracture, Drowning, Bleeding and Choking', 11),
('23-BPE-202', 'theory_unit', 'II', 'Sports Injuries',
'Ways and methods for the prevention of injuries in sports; Meaning of Acute and Chronic Sports injuries; Classification of Sports injuries, symptoms and treatment for injuries of Skin, Bone, Ligaments, Muscles, Joints and Nerves; Massage: Meaning, Types of Massages, Brief History; Physiological Effects of Massage', 12),
('23-BPE-202', 'theory_unit', 'III', 'Introduction of Physiotherapy',
'Meaning and Definition of Physiotherapy and Rehabilitation; Guiding principles, Scope and Benefits of physiotherapy; Technique and Physiological Effect of Electrotherapy, infrared rays, Ultraviolet rays, short wave diathermy and Ultrasonic rays; Technique and Physiological Effect of Steam Bath, Sauna Bath and Hot Water Fomentation', 12),
('23-BPE-202', 'theory_unit', 'IV', 'Therapeutic Exercise',
'Meaning and definition of Therapeutic Exercise; Scope and Principles of Therapeutic Exercise; Therapeutic exercise: Classification and Physiological Effects; Meaning and Types of Free Mobility Exercise; Therapeutic Exercises for Shoulder, Elbow, Wrist and Finger Joints, Hips, Knee, Ankle and Foot joints, Trunk, Head and Neck', 11);

INSERT INTO course_content (course_code, section_type, unit_number, unit_title, topics, marks, contact_hours) VALUES
('23-BPE-202', 'practical_unit', 'I', 'Sports Medicine Kit and Bandages',
'Sports Medicine Kit; Techniques of tying various types of Bandages; Assessment Technique of various types of injuries', 15, 15),
('23-BPE-202', 'practical_unit', 'II', 'CPR and Electrotherapy',
'Cardiopulmonary resuscitation (CPR) Technique; Procedure of operating Electrotherapy, infrared rays, Ultraviolet rays, Short wave Diathermy and Ultrasonic Rays', 15, 15);

-- ===== 23-BPE-203: Officiating and Coaching =====
INSERT INTO course_content (course_code, section_type, unit_number, unit_title, topics, contact_hours) VALUES
('23-BPE-203', 'theory_unit', 'I', 'Introduction of Officiating and Coaching',
'Meaning, definition and concept of Officiating and Coaching; Principles of Officiating and Principles of Coaching; Measures for improving the standards of Officiating and Coaching; Relation of official and coach with management, players/teams and spectators; Ethics for Officiating and Coaching', 11),
('23-BPE-203', 'theory_unit', 'II', 'Officiating',
'Philosophy of Officiating; Duties of official in general, pre, during and post-game for various major games and sports; Dress Codes of officials for various major games; Numbers of officials, Officiating positions, Signals and Movement of Officials; Latest technological advancements in the Officiating', 12),
('23-BPE-203', 'theory_unit', 'III', 'Coaching',
'Philosophy of Coaching; Duties of coach in general, pre-game, during-game and post-game duties; Latest technological advancements in the coaching; Awards for coaches at State and National level; Famous Coaches of various major games and sports', 12),
('23-BPE-203', 'theory_unit', 'IV', 'Career Opportunities in Coaching and Officiating',
'Academic and Technical Qualifications of officials for various major games and sports; Academic and Technical Qualifications of coaches; Famous Institutes that offer technical qualifications in Officiating and Coaching; Career opportunities in Officiating and Coaching: Government, Clubs, Private Sectors; Qualities of an ideal coach and official', 10);

INSERT INTO course_content (course_code, section_type, unit_number, unit_title, topics, marks, contact_hours) VALUES
('23-BPE-203', 'practical_unit', 'I', 'Kabaddi',
'Court specifications, general rules and basic skills of Kabaddi', 15, 15),
('23-BPE-203', 'practical_unit', 'II', 'Football',
'Court specifications, general rules and basic skills of Football', 15, 15);

-- ===== 23-BPE-204: Asian and Commonwealth Games (Theory Only) =====
INSERT INTO course_content (course_code, section_type, unit_number, unit_title, topics, contact_hours) VALUES
('23-BPE-204', 'theory_unit', 'I', 'Asian Games',
'Philosophy of Asian games; Brief history of the development of the Asian Games; Reorganization and expansion of the Asian Games; Symbols and Mascots of Asian Games; Countries participating in the Asian Games; Numbers of Events conducted in Asian games', 8),
('23-BPE-204', 'theory_unit', 'II', 'Commonwealth Games',
'Philosophy of Commonwealth Games; Brief history of the development of the Commonwealth Games; Structure of Commonwealth Games Federation; Queen''s Baton Relay, Opening and Closing Ceremony of Commonwealth Games; Countries participating in the Commonwealth Games; Numbers of Events conducted in Commonwealth Games', 8),
('23-BPE-204', 'theory_unit', 'III', 'Indian Performance in Asian Games and Commonwealth Games',
'Organization of Asian Games in India; Organization of Commonwealth Games in India; Indian Performance in Asian Games; Indian Performance in Commonwealth Games', 7);

-- ===== 23-BPE-301: Sports Psychology =====
INSERT INTO course_content (course_code, section_type, unit_number, unit_title, topics, contact_hours) VALUES
('23-BPE-301', 'theory_unit', 'I', 'Introduction to Sports Psychology',
'Overview of Sport Psychology and its role in Sports performance; History and Development of Sports Psychology; Role of Sports Psychology in Enhancing Athletic Performance; Applications of Psychological Principles in sports', 12),
('23-BPE-301', 'theory_unit', 'II', 'Psychological Skill Training',
'Goal Setting and motivation in Sports; Concentration and attention control; Mental Imagery and Visualization training; Relaxation and Stress management', 10),
('23-BPE-301', 'theory_unit', 'III', 'Group Dynamics and Leadership in Sports',
'Group Dynamics in Sports Team; Leadership style and their Impact on Team Performance; Communication in Sports; Conflict Resolution in Sports Team', 12),
('23-BPE-301', 'theory_unit', 'IV', 'Performance Enhancement and Injury Prevention',
'Psychological factors affecting sports performance; Psychological effects of sports injuries; Psychological Interventions for rehabilitation for sports Injuries; Strategies for enhancing sports performance', 11);

INSERT INTO course_content (course_code, section_type, unit_number, unit_title, topics, marks, contact_hours) VALUES
('23-BPE-301', 'practical_unit', 'I', 'Sports Mental Toughness for Athletes (SMTQ)',
'Sports Mental Toughness Questionnaire (SMTQ) by Sheard, Golby and Wersch 2009', 5, 7),
('23-BPE-301', 'practical_unit', 'II', 'Sports Competition Anxiety Test (SCAT)',
'Sports Competition Anxiety Test (SCAT) by Martens et al. 1990', 5, 8),
('23-BPE-301', 'practical_unit', 'III', 'Sports Motivation Scale (SMS-28)',
'The Sports Motivation Scale (SMS-28) by Luc G. Pelletier, Michelle Fortier, etc. 1995', 5, 7),
('23-BPE-301', 'practical_unit', 'IV', 'Practical File',
'Practical Record File of all psychological tests conducted', 5, 8);

-- ===== 23-BPE-302: Sports Nutrition =====
INSERT INTO course_content (course_code, section_type, unit_number, unit_title, topics, contact_hours) VALUES
('23-BPE-302', 'theory_unit', 'I', 'Introduction to Nutrition',
'Nutrition: Meaning, Definition & Importance; Objectives of Sports Nutrition; Factors affecting Nutritional Requirement of Players; Basic Principles of Sports Nutrition', 12),
('23-BPE-302', 'theory_unit', 'II', 'Nutrients',
'Nutrients: Meaning & Their Classification: Macro and Micro; Carbohydrates, Fats & Protein: Meaning, Types & Resources; Vitamins & Minerals: Meaning, Types & Resources; Role of water in Human Body', 12),
('23-BPE-302', 'theory_unit', 'III', 'Food Groups and Balanced Diet',
'Food Groups: Meaning & Types; Importance of various Food Groups; Balanced Diet: Meaning & Importance; Components of Balanced Diet', 10),
('23-BPE-302', 'theory_unit', 'IV', 'Dietary Disorders',
'Dietary Disorders: Meaning & Types; Anorexia Nervosa: Meaning & Side Effects; Bulimia Nervosa: Meaning, Symptoms & Side Effects; Binge Eating Disorders: Meaning, Symptoms & Side Effects', 11);

INSERT INTO course_content (course_code, section_type, unit_number, unit_title, topics, marks, contact_hours) VALUES
('23-BPE-302', 'practical_unit', 'I', 'Meal Planning for Endurance Athletes',
'Meal Planning for Endurance Athletes - calculation and preparation', 5, 7),
('23-BPE-302', 'practical_unit', 'II', 'Meal Planning for Weight Lifters',
'Meal Planning for weight lifters - calculation and preparation', 5, 8),
('23-BPE-302', 'practical_unit', 'III', 'Meal Planning for Weight Loss',
'Meal Planning for Weight Loss - calculation and preparation', 5, 7),
('23-BPE-302', 'practical_unit', 'IV', 'Practical File',
'Practical Record File of all meal plans prepared', 5, 8);

-- ===== 23-BPE-303: Fundamentals of Sports Training =====
INSERT INTO course_content (course_code, section_type, unit_number, unit_title, topics, contact_hours) VALUES
('23-BPE-303', 'theory_unit', 'I', 'Introduction to Sports Training',
'Overview of sports training and its objectives; Basic principles of training (Overload, Specificity and Progressive); Training methods and their techniques; Importance of well-rounded fitness', 12),
('23-BPE-303', 'theory_unit', 'II', 'Training Load',
'Training Load: Meaning and Importance; Types of Training load; Components of Training load; Relationship between training load and sports performance', 12),
('23-BPE-303', 'theory_unit', 'III', 'Physical Fitness',
'Physical Fitness: Meaning and Importance; Components of Physical Fitness (Strength, Speed, Endurance, Flexibility and Coordinative abilities); Importance of Nutrition in Physical Fitness', 11),
('23-BPE-303', 'theory_unit', 'IV', 'Recovery',
'Recovery: Meaning and Importance; Physiological & Psychological aspects of Recovery; Principles of Recovery (Rest, Nutrition, Hydration, Sleep & Active Recovery); Recovery Strategies and Techniques', 10);

INSERT INTO course_content (course_code, section_type, unit_number, unit_title, topics, marks, contact_hours) VALUES
('23-BPE-303', 'practical_unit', 'I', 'Interval Training Method',
'Interval Training Method - demonstration and practice', 5, 7),
('23-BPE-303', 'practical_unit', 'II', 'Continuous Training Method',
'Continuous Training Method - demonstration and practice', 5, 8),
('23-BPE-303', 'practical_unit', 'III', 'Circuit Training Method',
'Circuit Training Method - demonstration and practice', 5, 7),
('23-BPE-303', 'practical_unit', 'IV', 'Practical File',
'Practical Record File of all training methods conducted', 5, 8);

-- ===== 23-BPE-304: Athletic Track and Field Events =====
INSERT INTO course_content (course_code, section_type, unit_number, unit_title, topics, contact_hours) VALUES
('23-BPE-304', 'theory_unit', 'I', 'Introduction to Athletics and Track Events',
'Introduction to the History and Development of Athletics; Overview of track events (Sprints, Middle Distance, Long Distance, Hurdles and Relays); Introduction to the Rules and Regulations of track events; Importance of Track events in the Olympic Games and other International Competitions', 12),
('23-BPE-304', 'theory_unit', 'II', 'Track Events: Sprints and Hurdles',
'Bio-mechanics of Sprinting and Hurdling; Training and Conditioning for Sprinters and Hurdlers; Techniques for Starting, Acceleration and Finishing; Strategies for Sprints and Hurdle Races; Analysis of famous Sprint and Hurdle events and athletes', 10),
('23-BPE-304', 'theory_unit', 'III', 'Track Events: Middle and Long Distances',
'Bio-mechanics of middle and long distance running; Training and Conditioning for middle and long distance runners; Techniques for Starting, Pacing and Finishing; Strategies for middle and long distance Races; Analysis of famous middle and long distance events and athletes', 12),
('23-BPE-304', 'theory_unit', 'IV', 'Field Events: Jumps and Throws',
'Bio-mechanics of Jumping and Throwing; Training and Conditioning for Jumpers and Throwers; Techniques for Jumping and Throwing Events; Analysis of famous Jumping and Throwing events and athletes', 11);

INSERT INTO course_content (course_code, section_type, unit_number, unit_title, topics, marks, contact_hours) VALUES
('23-BPE-304', 'practical_unit', 'I', 'Sprints',
'Sprints: 100m, 200m & 400m - techniques and practice', 5, 7),
('23-BPE-304', 'practical_unit', 'II', 'Shot Put and Discus Throw',
'Shot Putt & Discus throw - techniques and practice', 5, 8),
('23-BPE-304', 'practical_unit', 'III', 'Jumps',
'Jumps: Long Jump, High Jump & Triple Jump - techniques and practice', 5, 7),
('23-BPE-304', 'practical_unit', 'IV', 'Practical File',
'Evaluation of Practical File of all track and field activities', 5, 8);

-- ===== 23-BPE-401: Physical Fitness and Wellness =====
INSERT INTO course_content (course_code, section_type, unit_number, unit_title, topics, contact_hours) VALUES
('23-BPE-401', 'theory_unit', 'I', 'Overview of Physical Fitness and Wellness',
'Physical Fitness and wellness: meaning and its importance; Dimensions of wellness; Principles of Physical fitness and wellness; Relationship between physical fitness and wellness', 12),
('23-BPE-401', 'theory_unit', 'II', 'Fitness Assessment and Goal Setting',
'Methods for assessing cardio-respiratory endurance, muscular strength, flexibility and body composition; Importance of setting SMART fitness goals; Strategies for goal setting and achievement; Monitoring and Adjusting fitness goals', 11),
('23-BPE-401', 'theory_unit', 'III', 'Strategies for Enhancing Wellness',
'Physical wellness strategies (Exercise, Nutrition, sleep, stress management); Emotional wellness strategies (Mindfulness, self-care and positive psychology); Intellectual wellness strategies (Lifelong learning, critical thinking and problem solving); Social Wellness strategies (Communication, Relationship and community involvement)', 12),
('23-BPE-401', 'theory_unit', 'IV', 'Sports Nutrition for Athletes',
'Nutritional requirements for Endurance athletes; Special Nutritional requirements for Pregnant Athletes; Nutritional alteration for weight loss and weight gain; Diet plan for sprinters', 10);

INSERT INTO course_content (course_code, section_type, unit_number, unit_title, topics, marks, contact_hours) VALUES
('23-BPE-401', 'practical_unit', 'I', 'AAPHER Youth Fitness Test 1976',
'AAPHER Youth fitness test 1976 - administration and scoring', 5, 7),
('23-BPE-401', 'practical_unit', 'II', 'Canadian Fitness Test',
'Canadian Fitness Test - administration and scoring', 5, 8),
('23-BPE-401', 'practical_unit', 'III', 'Diet Plan for Weight Loss',
'Preparation and analysis of diet plan for weight loss', 5, 7),
('23-BPE-401', 'practical_unit', 'IV', 'Diet Plan for Weight Gain',
'Preparation and analysis of diet plan for weight gain', 5, 8);

-- ===== 23-BPE-402: Sports Sociology =====
INSERT INTO course_content (course_code, section_type, unit_number, unit_title, topics, contact_hours) VALUES
('23-BPE-402', 'theory_unit', 'I', 'Introduction to Sports Sociology',
'Meaning and Definition of Sports Sociology; Nature and scope of Sociology; Importance of Sports Sociology; Social Process: Co-operation, Competition, Conflict, Accommodation, and Assimilation', 12),
('23-BPE-402', 'theory_unit', 'II', 'Culture and Civilization',
'Meaning, definition and Characteristics of Culture; Relationship of sports with culture; Elements of culture: Cognitive elements, Beliefs, Values and norms, Signs and non-normative ways of behaving; Meaning of Civilization; Difference between culture and civilization', 10),
('23-BPE-402', 'theory_unit', 'III', 'Sports and Socialization',
'Meaning and definition of socialization; Types of socialization: Primary, Anticipatory, Developmental and Re-socialization; Socialization through Physical Education; Social Group life in sports: Primary and secondary groups', 12),
('23-BPE-402', 'theory_unit', 'IV', 'Social Issues in Sports',
'Gender roles, Racial diversity and stereotypes in sports; Title IX and its impact; Role of physical education in the context of social problems; Status of Sports in educational institutions', 11);

INSERT INTO course_content (course_code, section_type, unit_number, unit_title, topics, marks, contact_hours) VALUES
('23-BPE-402', 'practical_unit', 'I', 'Co-operation and Competition Test',
'Co-operation and competition test - Research Series of APRC, Agra, 1997', 5, 7),
('23-BPE-402', 'practical_unit', 'II', 'Self-Concept Questionnaire',
'Self-concept questionnaire by Dr. Raj Kumar Saraswat', 5, 8),
('23-BPE-402', 'practical_unit', 'III', 'ASAAP Socio-Metric Measure',
'ASAAP (A Socio-Metric measure) by Dr. S.L. Chopra, Lucknow', 5, 7),
('23-BPE-402', 'practical_unit', 'IV', 'Practical File',
'Practical Record File of all sociological tests conducted', 5, 8);

-- ===== 23-BPE-403: Organization and Administration =====
INSERT INTO course_content (course_code, section_type, unit_number, unit_title, topics, contact_hours) VALUES
('23-BPE-403', 'theory_unit', 'I', 'Introduction to Organization and Administration',
'Organization & Administration: Meaning, Definition & Importance; Principles of Organization & Administration; Functions of Organization & Administration; Characteristics of Organization & Administration', 12),
('23-BPE-403', 'theory_unit', 'II', 'Sports Equipments and Facilities',
'Sports Equipments & Facilities: Meaning & Importance; Classification of Sports Equipments; Care & Maintenance of different types of Sports Equipments & Facilities; Need of Sports Equipments & Facilities', 10),
('23-BPE-403', 'theory_unit', 'III', 'Tournament',
'Tournament: Meaning & Importance; Types of Tournaments; Bye: Criteria for giving Byes; Fixtures on Knockout & Round Robin Tournament Basis', 11),
('23-BPE-403', 'theory_unit', 'IV', 'Budget Planning',
'Budget: Meaning & Importance of Budget in Physical Education; Criteria of Good Budget; Preparation of Budget Planning; Format of Making Budget of an Institution', 12);

INSERT INTO course_content (course_code, section_type, unit_number, unit_title, topics, marks, contact_hours) VALUES
('23-BPE-403', 'practical_unit', 'I', 'Methods of Issuing and Return of Sports Equipments',
'Methods of Issuing and Return of Sports Equipments - practical demonstration', 5, 7),
('23-BPE-403', 'practical_unit', 'II', 'Care and Maintenance of Sports Equipments',
'Methods of Care and maintenance of sports equipments and facilities', 5, 8),
('23-BPE-403', 'practical_unit', 'III', 'Methods of Storing Sports Equipments',
'Methods of storing various types of Sports Equipments', 5, 7),
('23-BPE-403', 'practical_unit', 'IV', 'Practical File',
'Practical Record File of all organizational activities', 5, 8);

-- ===== 23-BPE-501: Sports Journalism =====
INSERT INTO course_content (course_code, section_type, unit_number, unit_title, topics, contact_hours) VALUES
('23-BPE-501', 'theory_unit', 'I', 'Introduction to Sports Journalism',
'Meaning, Definition and scope of sports journalism; Historical overview and evolution of sports Journalism; Role and responsibilities of sports journalists; Ethics in sports reporting: fairness, accuracy, and objectivity', 12),
('23-BPE-501', 'theory_unit', 'II', 'Understanding the Sports Media Landscape',
'Different types of sports media (print, broadcast, online); Basics of sports writing: lead, inverted pyramid, and feature stories; Effective headline writing for sports articles; Elements of good writing', 12),
('23-BPE-501', 'theory_unit', 'III', 'Sports Interviewing Skills',
'Meaning and definition of interview; Principles of effective sports interviews; Techniques for conducting athlete interviews; Ethical considerations in sports interviews', 11),
('23-BPE-501', 'theory_unit', 'IV', 'Multimedia Sports Reporting',
'Introduction to multimedia storytelling in sports journalism; Using photography and video in sports reporting; Basics of sports broadcasting and commentary; Podcasting and sports journalism', 10);

INSERT INTO course_content (course_code, section_type, unit_number, unit_title, topics, marks, contact_hours) VALUES
('23-BPE-501', 'practical_unit', 'I', 'Field Reporting',
'Field Reporting - practical exercise', 5, 7),
('23-BPE-501', 'practical_unit', 'II', 'Interviews',
'Conducting sports interviews - practical exercise', 5, 8),
('23-BPE-501', 'practical_unit', 'III', 'Writing and Producing News Articles',
'Writing and producing News Articles for sports journalism', 5, 7),
('23-BPE-501', 'practical_unit', 'IV', 'Multimedia Contents',
'Creating multimedia content for sports journalism', 5, 8);

-- ===== 23-BPE-502: Kinesiology =====
INSERT INTO course_content (course_code, section_type, unit_number, unit_title, topics, contact_hours) VALUES
('23-BPE-502', 'theory_unit', 'I', 'Introduction to Kinesiology',
'Kinesiology: Meaning, Definition and Importance in Physical Education and Sports; Aim and Objectives of Kinesiology in Physical Education; Meaning and types of Bones; Structure and Functions of Bones', 12),
('23-BPE-502', 'theory_unit', 'II', 'Joints',
'Joints: Meaning and Classification of Joints; Structure and Functions of Joints; Fundamental movements around the Joints; Plane and Axis and its significance in Sports', 10),
('23-BPE-502', 'theory_unit', 'III', 'Muscles',
'Muscles: Meaning and types of Muscles; Functional Classification of Muscles; Properties of Muscles; Types of Muscle Contraction – Isometric, Isotonic, Isokinetic, Agonists, Antagonists, Neutralizers and Stabilizers', 12),
('23-BPE-502', 'theory_unit', 'IV', 'Posture and Postural Deformities',
'Posture: Meaning, type and Importance of Good Posture; Postural Deformities: Meaning, Cause; Kyphosis, Lordosis and Scoliosis: Meaning, Causes and Remedial Exercise; Knock Knee, Bow Legs and Flat Foot: Meaning, Causes and Remedial Exercise', 11);

INSERT INTO course_content (course_code, section_type, unit_number, unit_title, topics, marks, contact_hours) VALUES
('23-BPE-502', 'practical_unit', 'I', 'Identification of Types of Bones',
'Identification of different types of bones on skeleton and models', 5, 7),
('23-BPE-502', 'practical_unit', 'II', 'Identification of Skeletal Muscles',
'Identification of skeletal muscles of body on model and chart', 5, 8),
('23-BPE-502', 'practical_unit', 'III', 'Identification of Postural Deformities',
'Identification of Postural Deformities in subjects', 5, 7),
('23-BPE-502', 'practical_unit', 'IV', 'Practical File',
'Practical Record File of all kinesiology activities', 5, 8);

-- ===== 23-BPE-503: Sports Management =====
INSERT INTO course_content (course_code, section_type, unit_number, unit_title, topics, contact_hours) VALUES
('23-BPE-503', 'theory_unit', 'I', 'Introduction to Sports Management',
'Sports Management: Meaning, Definition & Importance; Scope of Sports management in Physical Education & Sports; Nature & Objective of Sports management; Functions of Sports management', 12),
('23-BPE-503', 'theory_unit', 'II', 'Facilities and Equipment Management',
'Facilities & Equipments: Meaning, Definition & Importance; Types of Facilities & Equipments in Sports; Care & maintenance of Sports Equipments: Meaning & Benefits; Types of Equipment Maintenance', 10),
('23-BPE-503', 'theory_unit', 'III', 'Leadership in Management',
'Leader: Meaning & Need of Leadership; Variations of Leadership in Sports Management; Characteristics of a Good Leader; Principles of Leadership in Physical Education & Sports', 12),
('23-BPE-503', 'theory_unit', 'IV', 'Financial Management',
'Financial Management: Meaning & Need in Sports; Objectives of Financial Management; Functions of Financial Management; Financial Performance Standards for Sports Management', 11);

INSERT INTO course_content (course_code, section_type, unit_number, unit_title, topics, marks, contact_hours) VALUES
('23-BPE-503', 'practical_unit', 'I', 'Methods of Issuing and Return of Sports Equipments',
'Methods of Issuing and Return of Sports Equipments - practical demonstration', 5, 7),
('23-BPE-503', 'practical_unit', 'II', 'Care and Maintenance of Sports Equipments',
'Methods of Care and maintenance of sports equipments and facilities', 5, 8),
('23-BPE-503', 'practical_unit', 'III', 'Methods of Storing Sports Equipments',
'Methods of storing various types of Sports Equipments', 5, 7),
('23-BPE-503', 'practical_unit', 'IV', 'Budget Planning for Institute',
'Budget Planning for Institute - preparation and presentation', 5, 8);

-- ===== 23-BPE-504: Stress Management =====
INSERT INTO course_content (course_code, section_type, unit_number, unit_title, topics, contact_hours) VALUES
('23-BPE-504', 'theory_unit', 'I', 'Introduction to Stress Management in Sports',
'Stress: Definition and its Physiological & Psychological effects on athletes; Sources of stress in sports: Competition, Training, Injuries and pressure from coaches, team mates and fans; Stress Management Techniques: Relaxation, Deep breathing, positive self-talk; Case Studies of athletes who have successfully managed stress', 12),
('23-BPE-504', 'theory_unit', 'II', 'Psychological Skill Training for Stress Management',
'Goal setting: meaning and importance of SMART goal; Imagery: Mental imagery to enhance performance and manage stress; Self-Talk: Importance in reducing stress and improving sports performance; Relaxation Techniques: Progressive muscles relaxation and meditation', 10),
('23-BPE-504', 'theory_unit', 'III', 'Stress Management in Team Sports',
'Team cohesion: Role of team cohesion in managing stress; Communication: Importance of effective communication in managing stress within a team; Leadership: Role of leadership in managing stress in team sports; Team Building: Team building activities that help manage stress', 12),
('23-BPE-504', 'theory_unit', 'IV', 'Stress Management for Coaches',
'Coach Stress: Common sources of stress for Coaches and ways to manage it; Coach-Athlete relationship: Role in managing stress; Coach Education: Importance in stress management; Coach Support System: Support systems available to coaches', 11);

INSERT INTO course_content (course_code, section_type, unit_number, unit_title, topics, marks, contact_hours) VALUES
('23-BPE-504', 'practical_unit', 'I', 'Yoga and Meditation',
'Yoga and Meditation - practical sessions for stress management', 5, 7),
('23-BPE-504', 'practical_unit', 'II', 'Self-Talk',
'Self-Talk techniques - practical exercise', 5, 8),
('23-BPE-504', 'practical_unit', 'III', 'Progressive Muscle Relaxation',
'Progressive Muscle Relaxation - practical sessions', 5, 7),
('23-BPE-504', 'practical_unit', 'IV', 'Practical File',
'Practical Record File of all stress management activities', 5, 8);

-- ===== 23-BPE-601: Test, Measurement and Evaluation =====
INSERT INTO course_content (course_code, section_type, unit_number, unit_title, topics, contact_hours) VALUES
('23-BPE-601', 'theory_unit', 'I', 'Introduction of Test, Measurement and Evaluation',
'Test, Measurement and Evaluation: Meaning and Importance in Physical Education and Sport; Objectives of Test, Measurement and Evaluation; Scope of Test, Measurement and Evaluation; Principles of Test, Measurement and Evaluation', 12),
('23-BPE-601', 'theory_unit', 'II', 'Reliability and Validity in Test Construction',
'Definition and Importance of Reliability and Validity; Types of Reliability (Test-and Re-test reliability, Inter-rater reliability, Internal Consistency reliability); Types of Validity (Content validity, criterion validity, construct validity); Techniques for improving reliability and validity', 10),
('23-BPE-601', 'theory_unit', 'III', 'Motor Fitness Test and Physical Fitness Test',
'Indiana Motor fitness test, Oregon Motor fitness test; Physical Fitness tests (AAHPERD Health related fitness battery, ACSM Health Related physical fitness test); Cardio-vascular Fitness Test (Harvard Step test, Multi-stage fitness test); Physiological Test (Aerobic and Anaerobic capacity test)', 12),
('23-BPE-601', 'theory_unit', 'IV', 'Technology in Test Measurement and Evaluation',
'Use of Technology in Physical Education testing and evaluation; Advantages and Disadvantages of using Technology; Technology based tests and measurements (pedometer, heart rate monitor and fitness apps); Ethical consideration in using technology for testing and evaluation', 11);

INSERT INTO course_content (course_code, section_type, unit_number, unit_title, topics, marks, contact_hours) VALUES
('23-BPE-601', 'practical_unit', 'I', 'Measurement of Height and Body Circumferences',
'Measurement of Height and circumference of different Body parts', 5, 7),
('23-BPE-601', 'practical_unit', 'II', 'Standing and Sitting Height Measurement',
'Methods of measuring standing height and sitting height', 5, 8),
('23-BPE-601', 'practical_unit', 'III', 'Harvard Step Test',
'Calculating physical fitness with Harvard Step Test', 5, 7),
('23-BPE-601', 'practical_unit', 'IV', 'BMI Calculation',
'Calculating BMI and its interpretation', 5, 8);

-- ===== 23-BPE-602: Biomechanics =====
INSERT INTO course_content (course_code, section_type, unit_number, unit_title, topics, contact_hours) VALUES
('23-BPE-602', 'theory_unit', 'I', 'Introduction to Biomechanics',
'Meaning and importance of biomechanics; Mechanical properties of bones, muscles, and tissue; Kinematics and dynamics: Motion of biological systems including concept of velocity, acceleration and forces', 12),
('23-BPE-602', 'theory_unit', 'II', 'Biomechanics of Muscular-Skeletal System',
'Structure and composition of bone; Mechanism of muscle contraction and force generation; Range of motion and joint stability', 10),
('23-BPE-602', 'theory_unit', 'III', 'Biomechanics of Human Movement',
'Biomechanics of human walking; Biomechanics of running; Biomechanics of jumping', 12),
('23-BPE-602', 'theory_unit', 'IV', 'Biomechanics of Injury and Rehabilitation',
'Mechanism of tissue damage including fracture, sprain and strain; Mechanism of tissue repair and rehabilitation including muscle strengthening and joint mobilization; Design and functions of prosthetics and orthotics, including their impact on biomechanics', 11);

INSERT INTO course_content (course_code, section_type, unit_number, unit_title, topics, marks, contact_hours) VALUES
('23-BPE-602', 'practical_unit', 'I', 'Hop Test',
'Hop test - administration and interpretation', 5, 7),
('23-BPE-602', 'practical_unit', 'II', 'Sit and Reach Test',
'Sit and Reach Test - administration and interpretation', 5, 8),
('23-BPE-602', 'practical_unit', 'III', 'Shuttle Run Test',
'Shuttle Run Test - administration and interpretation', 5, 7),
('23-BPE-602', 'practical_unit', 'IV', 'Practical File',
'Practical Record File of all biomechanics tests conducted', 5, 8);

-- ===== 23-BPE-603: Curriculum Design in Physical Education =====
INSERT INTO course_content (course_code, section_type, unit_number, unit_title, topics, contact_hours) VALUES
('23-BPE-603', 'theory_unit', 'I', 'Introduction to Curriculum',
'Curriculum: Meaning, Definition & Importance; Difference between Curriculum & Syllabus; Scope of Curriculum in Physical Education; Basis of Curriculum in Physical Education', 12),
('23-BPE-603', 'theory_unit', 'II', 'Determinants of Curriculum Development',
'Essential Steps in Designing Physical Education Curriculum; Factors Affecting Curriculum Development; Basic Principles of Curriculum in Physical Education; Procedure of Curriculum Development', 11),
('23-BPE-603', 'theory_unit', 'III', 'Types and Approaches in Curriculum',
'Curriculum Design Model: Subject Centered, Learner Centered & Problem Centered; Approaches in Curriculum Development: Developmental Approach, Intra-Disciplinary Approach & Functional Approach; Trends in Curriculum Development: Lifelong Learning, Collaborative Curriculum & Core Curriculum', 12),
('23-BPE-603', 'theory_unit', 'IV', 'Evaluation in Curriculum',
'Evaluation: Meaning & Need of Evaluation; Aim & Objectives of Evaluation; Types of Evaluation; Role of Physical Education Teacher in Evaluation Process', 10);

INSERT INTO course_content (course_code, section_type, unit_number, unit_title, topics, marks, contact_hours) VALUES
('23-BPE-603', 'practical_unit', 'I', 'Motor Fitness Test',
'Illinois Agility Run and Standing Long jump Test - administration and scoring', 5, 7),
('23-BPE-603', 'practical_unit', 'II', 'Physical Fitness Test',
'Harvard Step Test and AAHPERD Health related fitness battery - administration and scoring', 5, 8),
('23-BPE-603', 'practical_unit', 'III', 'Skill Test',
'Harban''s Hockey test and volleyball Russell-Lange test - administration and scoring', 5, 7),
('23-BPE-603', 'practical_unit', 'IV', 'Practical File',
'Practical Record File of all curriculum tests conducted', 5, 8);

-- ===== 23-BPE-604: Posture and Athletic Care =====
INSERT INTO course_content (course_code, section_type, unit_number, unit_title, topics, contact_hours) VALUES
('23-BPE-604', 'theory_unit', 'I', 'Introduction to Posture',
'Posture: Definition and its components; Impact of Posture on Health; Benefits of good posture for overall wellbeing; Benefits of Good Posture on sports performance', 12),
('23-BPE-604', 'theory_unit', 'II', 'Assessing and Improving Posture',
'Posture assessment techniques: Visual observation and Goniometry; Corrective exercises for improving posture; Gait Analysis for identifying postural imbalance and movement dysfunction', 12),
('23-BPE-604', 'theory_unit', 'III', 'Postural Deformities',
'Posture deformity: Meaning and Causes; Symptoms of Postural Deformities; Various types of Postural deformities: Kyphosis, Lordosis, Scoliosis, Knock-knee and Flat foot; Corrective Exercises for different Postural Deformities', 11),
('23-BPE-604', 'theory_unit', 'IV', 'Posture and Injury Prevention',
'Postural Imbalance and increased risk of injury; Role of Posture in Joint Mechanics: how posture affects joint mechanics and injury risk; Posture and Injury Prevention: ways and means to prevent common sports related injuries; Corrective Exercises for injury prevention: Core-strengthening exercises and flexibility training', 10);

INSERT INTO course_content (course_code, section_type, unit_number, unit_title, topics, marks, contact_hours) VALUES
('23-BPE-604', 'practical_unit', 'I', 'Functional Movement Screen (FMS)',
'Functional movement screen (FMS) to evaluate fundamental movement pattern', 5, 7),
('23-BPE-604', 'practical_unit', 'II', 'Vertical Compression Test',
'Vertical compression test: to assess body''s ability to handle vertical forces and maintain proper alignment under load', 5, 8),
('23-BPE-604', 'practical_unit', 'III', 'Elbow Flexion Test',
'Elbow flexion test: to evaluate the shoulder''s stability and mobility particularly used for overhead movements', 5, 7),
('23-BPE-604', 'practical_unit', 'IV', 'Practical File',
'Practical Record File of all posture assessment activities', 5, 8);

-- ===== 23-BPE-605: Adapted Physical Education =====
INSERT INTO course_content (course_code, section_type, unit_number, unit_title, topics, contact_hours) VALUES
('23-BPE-605', 'theory_unit', 'I', 'Overview of Adapted Physical Education',
'Adapted Physical Education: Meaning, Need; Factors Affecting Performance in Adapted Physical Education; Objectives of Adapted Physical Education; Scope of Adapted Physical Education', 12),
('23-BPE-605', 'theory_unit', 'II', 'Types of Disabilities',
'Visual Impairment/Blindness: Meaning, Causes, Characteristics & Identifications; Hearing Impairment & Deafness: Meaning, Causes, Characteristics & Identifications; Intellectual Impairment: Meaning, Causes, Characteristics & Identifications; Orthopedic Impairment/Amputation/Loss of Limbs: Meaning, Causes, Characteristics', 11),
('23-BPE-605', 'theory_unit', 'III', 'Teachers Preparation in Special Adapted Physical Education',
'Competency in Teaching by Physical Education Teacher; Communication Technology for Specially Challenged Students; Supportive Teaching for Specially Challenged Students; Collaborative Consultancy for Specially Challenged Students', 10),
('23-BPE-605', 'theory_unit', 'IV', 'Adaptive Physical Education Program for Various Disabilities',
'Adapted Physical Education Program for blind and visually impaired students; Adapted Physical Education Program for hearing impaired and deaf students; Adapted Physical Education Program for Intellectually challenged students; Adapted Physical Education Program for Orthopaedic Impaired students', 12);

INSERT INTO course_content (course_code, section_type, unit_number, unit_title, topics, marks, contact_hours) VALUES
('23-BPE-605', 'practical_unit', 'I', 'Functional Reach Test',
'Functional Reach Test: to assess balance and mobility in individuals with disabilities', 5, 7),
('23-BPE-605', 'practical_unit', 'II', 'Bruininks-Oseretsky Test of Motor Proficiency',
'Bruininks-Oseretsky Test of Motor Proficiency: designed to measure motor proficiency to assess balance, coordination, strength and agility', 5, 8),
('23-BPE-605', 'practical_unit', 'III', 'Test of Motor Proficiency (TOM)',
'Test of Motor Proficiency (TOM): to measure motor proficiency in children including running, jumping, throwing and catching', 5, 7),
('23-BPE-605', 'practical_unit', 'IV', 'Practical File',
'Practical Record File of all adapted physical education activities', 5, 8);

-- =====================================================
-- DONE! Total: 24 courses, ~192 content rows
-- =====================================================
