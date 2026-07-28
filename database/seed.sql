-- SmartGov AI – Kakinada
-- Seed Data: Offices, Services, Admin Account
-- Run AFTER schema.sql

-- =============================================
-- INSERT OFFICES (Kakinada)
-- =============================================

-- Government Offices
INSERT INTO offices (id, name, type, city, address, phone, google_map_url, working_hours, lunch_break) VALUES
(
  'a1000000-0000-0000-0000-000000000001',
  'MeeSeva',
  'government',
  'Kakinada',
  'MeeSeva Center, Main Road, Kakinada, Andhra Pradesh 533001',
  '0884-2301234',
  'https://maps.google.com/?q=MeeSeva+Kakinada',
  '{"monday":"09:00-17:00","tuesday":"09:00-17:00","wednesday":"09:00-17:00","thursday":"09:00-17:00","friday":"09:00-17:00","saturday":"09:00-13:00","sunday":"closed"}',
  '{"start":"13:00","end":"14:00"}'
),
(
  'a1000000-0000-0000-0000-000000000002',
  'RTO Office',
  'government',
  'Kakinada',
  'Regional Transport Office, Auto Nagar, Kakinada, AP 533003',
  '0884-2302345',
  'https://maps.google.com/?q=RTO+Kakinada',
  '{"monday":"10:00-17:00","tuesday":"10:00-17:00","wednesday":"10:00-17:00","thursday":"10:00-17:00","friday":"10:00-17:00","saturday":"10:00-13:00","sunday":"closed"}',
  '{"start":"13:00","end":"14:00"}'
),
(
  'a1000000-0000-0000-0000-000000000003',
  'Collectorate',
  'government',
  'Kakinada',
  'District Collectorate, Collectorate Road, Kakinada, AP 533001',
  '0884-2303456',
  'https://maps.google.com/?q=Collectorate+Kakinada',
  '{"monday":"10:30-17:00","tuesday":"10:30-17:00","wednesday":"10:30-17:00","thursday":"10:30-17:00","friday":"10:30-17:00","saturday":"closed","sunday":"closed"}',
  '{"start":"13:00","end":"14:00"}'
),
(
  'a1000000-0000-0000-0000-000000000004',
  'Municipal Corporation',
  'government',
  'Kakinada',
  'GVMC Office, Softy Center, Kakinada, AP 533001',
  '0884-2304567',
  'https://maps.google.com/?q=Municipal+Corporation+Kakinada',
  '{"monday":"10:00-17:00","tuesday":"10:00-17:00","wednesday":"10:00-17:00","thursday":"10:00-17:00","friday":"10:00-17:00","saturday":"10:00-13:00","sunday":"closed"}',
  '{"start":"13:00","end":"14:00"}'
),
(
  'a1000000-0000-0000-0000-000000000005',
  'Registration Office',
  'government',
  'Kakinada',
  'Sub-Registrar Office, Court Road, Kakinada, AP 533001',
  '0884-2305678',
  'https://maps.google.com/?q=Registration+Office+Kakinada',
  '{"monday":"10:00-16:00","tuesday":"10:00-16:00","wednesday":"10:00-16:00","thursday":"10:00-16:00","friday":"10:00-16:00","saturday":"closed","sunday":"closed"}',
  '{"start":"13:00","end":"14:00"}'
),
(
  'a1000000-0000-0000-0000-000000000006',
  'Tahsildar Office',
  'government',
  'Kakinada',
  'Tahsildar Office, Bommuru Road, Kakinada, AP 533002',
  '0884-2306789',
  'https://maps.google.com/?q=Tahsildar+Office+Kakinada',
  '{"monday":"10:00-17:00","tuesday":"10:00-17:00","wednesday":"10:00-17:00","thursday":"10:00-17:00","friday":"10:00-17:00","saturday":"10:00-13:00","sunday":"closed"}',
  '{"start":"13:00","end":"14:00"}'
),
(
  'a1000000-0000-0000-0000-000000000007',
  'Passport Office',
  'government',
  'Kakinada',
  'Passport Seva Kendra, Beside Collectorate, Kakinada, AP 533001',
  '0884-2307890',
  'https://maps.google.com/?q=Passport+Office+Kakinada',
  '{"monday":"09:00-17:00","tuesday":"09:00-17:00","wednesday":"09:00-17:00","thursday":"09:00-17:00","friday":"09:00-17:00","saturday":"closed","sunday":"closed"}',
  '{"start":"13:00","end":"14:00"}'
);

-- Banks
INSERT INTO offices (id, name, type, city, address, phone, google_map_url) VALUES
(
  'b1000000-0000-0000-0000-000000000001',
  'SBI',
  'bank',
  'Kakinada',
  'State Bank of India, Main Branch, Bander Road, Kakinada, AP 533001',
  '0884-2320001',
  'https://maps.google.com/?q=SBI+Kakinada+Main+Branch'
),
(
  'b1000000-0000-0000-0000-000000000002',
  'Union Bank',
  'bank',
  'Kakinada',
  'Union Bank of India, Jagannaickpur, Kakinada, AP 533005',
  '0884-2320002',
  'https://maps.google.com/?q=Union+Bank+Kakinada'
),
(
  'b1000000-0000-0000-0000-000000000003',
  'Canara Bank',
  'bank',
  'Kakinada',
  'Canara Bank, Main Road, Kakinada, AP 533001',
  '0884-2320003',
  'https://maps.google.com/?q=Canara+Bank+Kakinada'
),
(
  'b1000000-0000-0000-0000-000000000004',
  'Indian Bank',
  'bank',
  'Kakinada',
  'Indian Bank, Suryaraopeta, Kakinada, AP 533002',
  '0884-2320004',
  'https://maps.google.com/?q=Indian+Bank+Kakinada'
),
(
  'b1000000-0000-0000-0000-000000000005',
  'Andhra Bank',
  'bank',
  'Kakinada',
  'Andhra Bank, Softy Centre, Kakinada, AP 533001',
  '0884-2320005',
  'https://maps.google.com/?q=Andhra+Bank+Kakinada'
),
(
  'b1000000-0000-0000-0000-000000000006',
  'HDFC Bank',
  'bank',
  'Kakinada',
  'HDFC Bank, Bander Road, Kakinada, AP 533001',
  '0884-2320006',
  'https://maps.google.com/?q=HDFC+Bank+Kakinada'
),
(
  'b1000000-0000-0000-0000-000000000007',
  'ICICI Bank',
  'bank',
  'Kakinada',
  'ICICI Bank, Main Road, Kakinada, AP 533001',
  '0884-2320007',
  'https://maps.google.com/?q=ICICI+Bank+Kakinada'
),
(
  'b1000000-0000-0000-0000-000000000008',
  'Axis Bank',
  'bank',
  'Kakinada',
  'Axis Bank, Ramaraopeta, Kakinada, AP 533004',
  '0884-2320008',
  'https://maps.google.com/?q=Axis+Bank+Kakinada'
);

-- =============================================
-- INSERT SERVICES – MeeSeva
-- =============================================
INSERT INTO services (office_id, name, category, fees, fees_description, eligibility, processing_time, documents_required, steps, faqs) VALUES
(
  'a1000000-0000-0000-0000-000000000001',
  'Income Certificate',
  'Certificates',
  30.00,
  'Rs. 30 service charge',
  'Any resident of Andhra Pradesh',
  '3-7 working days',
  '["Aadhaar Card", "Ration Card", "Salary Slip or Income Proof", "Residence Proof", "Passport Size Photo", "Application Form"]',
  '["Visit MeeSeva center and take a token", "Submit application form with documents", "Pay Rs. 30 service fee", "Receive acknowledgment slip", "Collect certificate after 3-7 days or download online"]',
  '[{"q": "Can I apply online?", "a": "Yes, you can apply through meeseva.ap.gov.in"}, {"q": "How long is the certificate valid?", "a": "Income Certificate is valid for 1 year"}, {"q": "What if my income is from agriculture?", "a": "Submit land records (pattadar passbook) as income proof"}]'
),
(
  'a1000000-0000-0000-0000-000000000001',
  'Caste Certificate',
  'Certificates',
  30.00,
  'Rs. 30 service charge',
  'Citizens belonging to SC/ST/OBC communities',
  '7-15 working days',
  '["Aadhaar Card", "Ration Card", "Parent Caste Certificate (if available)", "School Transfer Certificate", "Passport Size Photo", "Application Form"]',
  '["Obtain application form from MeeSeva or download online", "Fill form and attach all documents", "Submit at MeeSeva center and pay Rs. 30", "Verification by Tahsildar may be required", "Collect certificate after verification"]',
  '[{"q": "Is caste certificate valid across states?", "a": "It is valid within Andhra Pradesh only. Other states have their own certificates."}, {"q": "What if parents do not have caste certificate?", "a": "Village level inquiry will be conducted by Tahsildar"}]'
),
(
  'a1000000-0000-0000-0000-000000000001',
  'Residence Certificate',
  'Certificates',
  30.00,
  'Rs. 30 service charge',
  'Any resident of Andhra Pradesh with at least 6 months of residence',
  '3-5 working days',
  '["Aadhaar Card", "Ration Card", "Electricity Bill or Water Bill", "Rental Agreement (if rented)", "Application Form"]',
  '["Visit MeeSeva with original documents", "Submit application and pay fee", "Field verification may be done", "Collect certificate after 3-5 days"]',
  '[{"q": "Is Aadhaar alone sufficient?", "a": "Aadhaar with current address + one supporting document is required"}]'
),
(
  'a1000000-0000-0000-0000-000000000001',
  'Birth Certificate',
  'Certificates',
  50.00,
  'Rs. 50 per copy',
  'Parents of child born in AP or person born in AP',
  '1-3 working days',
  '["Hospital Discharge Summary", "Parents Aadhaar Card", "Marriage Certificate of Parents", "Application Form"]',
  '["Apply within 21 days of birth for free registration", "After 21 days visit Municipal Corporation / Gram Panchayat", "Submit hospital discharge papers", "Pay fee and collect certificate"]',
  '[{"q": "What if birth was not registered?", "a": "Apply through Tahsildar with an affidavit and supporting documents"}, {"q": "Can I get it online?", "a": "Yes, through meeseva.ap.gov.in if already registered"}]'
),
(
  'a1000000-0000-0000-0000-000000000001',
  'Death Certificate',
  'Certificates',
  50.00,
  'Rs. 50 per copy',
  'Family members or legal heirs of deceased',
  '1-3 working days',
  '["Doctor or Hospital Death Certificate", "Deceased Person Aadhaar", "Applicant Aadhaar", "Application Form"]',
  '["Register death within 21 days at local Municipal office", "Submit hospital death certificate", "Pay fee and collect official death certificate"]',
  '[{"q": "What if death occurred at home?", "a": "Submit a declaration from local ward/gram panchayat head"}]'
);

-- Services for RTO
INSERT INTO services (office_id, name, category, fees, fees_description, eligibility, processing_time, documents_required, steps, faqs) VALUES
(
  'a1000000-0000-0000-0000-000000000002',
  'Driving Licence – Fresh',
  'Licence',
  400.00,
  'Learning Licence Rs. 200 + DL Rs. 200',
  'Age 18+ for four-wheelers, 16+ for two-wheelers (with guardian)',
  '30-60 days (after passing test)',
  '["Aadhaar Card", "Date of Birth Proof", "Address Proof", "Passport Size Photos (6)", "Medical Certificate (Form 1A)", "Application Form (Form 1)"]',
  '["Apply for Learning Licence (LL) online at parivahan.gov.in or visit RTO", "Appear for LL written test", "Practice driving for 30 days with LL", "Book Driving Test slot online", "Appear for practical test at RTO", "Collect DL after 7-10 days"]',
  '[{"q": "Can I apply online?", "a": "Yes, visit parivahan.gov.in or sarathi.parivahan.gov.in"}, {"q": "How many attempts for driving test?", "a": "You get 3 attempts within 6 months of LL issue"}]'
),
(
  'a1000000-0000-0000-0000-000000000002',
  'Driving Licence – Renewal',
  'Licence',
  200.00,
  'Renewal fee Rs. 200',
  'Holders of expired or near-expiry DL',
  '7-15 days',
  '["Existing DL (original)", "Aadhaar Card", "Medical Certificate (for 40+ age)", "Passport Size Photos (2)", "Application Form (Form 9)"]',
  '["Apply online at sarathi.parivahan.gov.in or visit RTO", "Submit form and pay fee", "Medical test if age 40+", "New DL will be dispatched by post"]',
  '[{"q": "Can I renew expired DL?", "a": "Yes up to 5 years after expiry. After that, fresh application needed."}]'
),
(
  'a1000000-0000-0000-0000-000000000002',
  'Vehicle Registration',
  'Registration',
  1500.00,
  'Varies by vehicle type and cost',
  'Vehicle owners purchasing new vehicles',
  '1-3 working days',
  '["Sale Certificate from Dealer", "Insurance Certificate", "PAN Card", "Aadhaar Card", "Address Proof", "Chassis & Engine Number Print"]',
  '["Dealer usually handles registration for new vehicles", "Visit RTO with documents if doing self-registration", "Pay road tax and registration fee", "RC will be dispatched by post"]',
  '[{"q": "Is dealer registration mandatory?", "a": "No, you can do it yourself at RTO"}]'
);

-- Services for Passport Office
INSERT INTO services (office_id, name, category, fees, fees_description, eligibility, processing_time, documents_required, steps, faqs) VALUES
(
  'a1000000-0000-0000-0000-000000000007',
  'Passport – Fresh Application',
  'Passport',
  1500.00,
  'Normal: Rs. 1500, Tatkaal: Rs. 3500',
  'Indian Citizens',
  '15-30 days (Normal), 3-7 days (Tatkaal)',
  '["Aadhaar Card", "Date of Birth Proof (Birth Certificate or 10th Marks)", "Address Proof", "Passport Size Photos (2)", "Applicant Signature"]',
  '["Register at passportindia.gov.in", "Fill online application form", "Pay fee online", "Book appointment at Passport Seva Kendra (PSK)", "Visit PSK with original documents", "Police verification (may take 15-20 days)", "Passport dispatched by post"]',
  '[{"q": "Is police verification mandatory?", "a": "Yes for normal applications. Tatkaal has post-dispatch verification."}, {"q": "Can I apply Tatkaal?", "a": "Yes, for urgent travel within 7 days or medical emergency"}]'
),
(
  'a1000000-0000-0000-0000-000000000007',
  'Passport – Renewal',
  'Passport',
  1500.00,
  'Normal: Rs. 1500, Tatkaal: Rs. 3500',
  'Holders of Indian passport expiring within 1 year or already expired',
  '15-30 days',
  '["Existing Passport (original)", "Aadhaar Card", "Address Proof if changed", "Photos (2)"]',
  '["Apply online at passportindia.gov.in", "Upload documents and pay fee", "Book appointment at PSK Kakinada", "Submit old passport and documents", "Receive new passport by post"]',
  '[{"q": "What if my address changed?", "a": "Submit new address proof with application"}]'
);

-- Services for Banks (SBI)
INSERT INTO services (office_id, name, category, fees, fees_description, eligibility, processing_time, documents_required, steps, faqs) VALUES
(
  'b1000000-0000-0000-0000-000000000001',
  'Account Opening',
  'Banking',
  0.00,
  'No fee for basic savings account',
  'Any Indian resident 18+ (or minor with guardian)',
  '1-3 working days',
  '["Aadhaar Card", "PAN Card", "Passport Size Photos (2)", "Signature", "Initial Deposit (min Rs. 500 for SBI)"]',
  '["Visit SBI branch with documents", "Take token for account opening counter", "Fill account opening form", "Submit documents and initial deposit", "Get temporary passbook", "Debit card and cheque book dispatched in 7-10 days"]',
  '[{"q": "Can I open account online?", "a": "Yes, through YONO SBI app for basic accounts"}, {"q": "What is minimum balance?", "a": "Rs. 500 for urban, Rs. 250 for rural branches"}]'
),
(
  'b1000000-0000-0000-0000-000000000001',
  'Loan Application',
  'Loans',
  0.00,
  'Processing fee varies by loan type (0.5-2%)',
  'Age 21-65, steady income source',
  '7-30 days depending on loan type',
  '["Aadhaar Card", "PAN Card", "Income Proof (salary slips / ITR)", "Bank Statements (6 months)", "Property Documents (for home loan)", "Business proof (for business loan)"]',
  '["Meet with loan officer to discuss requirement", "Submit loan application form with documents", "Bank verification and credit score check", "Loan sanction letter if approved", "Sign loan agreement", "Disbursement to account"]',
  '[{"q": "What CIBIL score is required?", "a": "750+ preferred. Below 650 may be rejected."}, {"q": "How long does approval take?", "a": "Personal loan: 1-3 days, Home loan: 15-30 days"}]'
),
(
  'b1000000-0000-0000-0000-000000000001',
  'KYC Update',
  'Banking',
  0.00,
  'Free service',
  'Existing account holders with outdated KYC',
  'Same day to 3 working days',
  '["Aadhaar Card", "PAN Card", "Recent Passport Photo (1)"]',
  '["Visit your home branch", "Request KYC update form", "Submit updated Aadhaar / PAN / address proof", "Bank will update within 3 working days"]',
  '[{"q": "Can I do KYC online?", "a": "Yes, through YONO app or net banking for Aadhaar-based e-KYC"}]'
);

-- =============================================
-- INSERT SUPER ADMIN
-- Password: Admin@123 (bcrypt hash below is placeholder - backend will re-hash on first login check)
-- Run: node -e "require('bcryptjs').hash('Admin@123',12).then(console.log)"
-- =============================================
INSERT INTO admins (username, password_hash, full_name, email, is_super_admin) VALUES
(
  'superadmin',
  '$2b$12$LKPeTABnqGSqaRBGVYN6k.8YCDq5RPDGfT5CvhANvpKtd8zWv8P9.',
  'Super Administrator',
  'admin@smartgov-kakinada.gov.in',
  true
);

-- =============================================
-- INSERT SAMPLE EMPLOYEES
-- Password for all: Employee@123
-- =============================================
INSERT INTO employees (employee_id, username, password_hash, full_name, office_id, role, designation) VALUES
(
  'EMP001',
  'meeseva_emp1',
  '$2b$12$LKPeTABnqGSqaRBGVYN6k.8YCDq5RPDGfT5CvhANvpKtd8zWv8P9.',
  'Ramesh Kumar',
  'a1000000-0000-0000-0000-000000000001',
  'employee',
  'Counter Operator'
),
(
  'EMP002',
  'rto_emp1',
  '$2b$12$LKPeTABnqGSqaRBGVYN6k.8YCDq5RPDGfT5CvhANvpKtd8zWv8P9.',
  'Suresh Babu',
  'a1000000-0000-0000-0000-000000000002',
  'employee',
  'Vehicle Inspector'
),
(
  'EMP003',
  'sbi_emp1',
  '$2b$12$LKPeTABnqGSqaRBGVYN6k.8YCDq5RPDGfT5CvhANvpKtd8zWv8P9.',
  'Lakshmi Devi',
  'b1000000-0000-0000-0000-000000000001',
  'employee',
  'Bank Officer'
),
(
  'EMP004',
  'passport_emp1',
  '$2b$12$LKPeTABnqGSqaRBGVYN6k.8YCDq5RPDGfT5CvhANvpKtd8zWv8P9.',
  'Venkata Rao',
  'a1000000-0000-0000-0000-000000000007',
  'manager',
  'PSK Manager'
);

-- =============================================
-- INSERT SAMPLE HISTORICAL DATA (for AI training)
-- =============================================
-- Generate sample data for MeeSeva last 30 days across all hours
DO $$
DECLARE
  d DATE;
  h INTEGER;
  office_ids UUID[] := ARRAY[
    'a1000000-0000-0000-0000-000000000001'::UUID,
    'a1000000-0000-0000-0000-000000000002'::UUID,
    'b1000000-0000-0000-0000-000000000001'::UUID
  ];
  oid UUID;
  base_count INTEGER;
  peak_multiplier DECIMAL;
  crowd VARCHAR(20);
BEGIN
  FOREACH oid IN ARRAY office_ids LOOP
    FOR d IN SELECT generate_series(CURRENT_DATE - INTERVAL '60 days', CURRENT_DATE - INTERVAL '1 day', '1 day')::DATE LOOP
      FOR h IN 9..17 LOOP
        -- Peak hours 10-12 and 14-16
        IF h BETWEEN 10 AND 12 OR h BETWEEN 14 AND 16 THEN
          base_count := 15 + floor(random() * 20)::INTEGER;
          peak_multiplier := 1.5;
          crowd := 'high';
        ELSIF h = 9 OR h = 17 THEN
          base_count := 5 + floor(random() * 8)::INTEGER;
          peak_multiplier := 0.8;
          crowd := 'low';
        ELSE
          base_count := 8 + floor(random() * 12)::INTEGER;
          peak_multiplier := 1.0;
          crowd := 'medium';
        END IF;
        
        -- Weekends are less busy
        IF EXTRACT(DOW FROM d) IN (0, 6) THEN
          base_count := (base_count * 0.5)::INTEGER;
          crowd := 'low';
        END IF;
        
        INSERT INTO historical_data (
          office_id, date, hour, day_of_week, visitor_count,
          tokens_issued, tokens_served, avg_wait_minutes,
          avg_service_minutes, crowd_level
        ) VALUES (
          oid, d, h, EXTRACT(DOW FROM d)::INTEGER,
          base_count,
          base_count + floor(random() * 5)::INTEGER,
          base_count - floor(random() * 3)::INTEGER,
          (10 + random() * 30)::DECIMAL(5,2),
          (5 + random() * 15)::DECIMAL(5,2),
          crowd
        )
        ON CONFLICT (office_id, date, hour) DO NOTHING;
      END LOOP;
    END LOOP;
  END LOOP;
END $$;
