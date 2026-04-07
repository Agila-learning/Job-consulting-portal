const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');

// Define heuristic keywords and logic
const TARGET_KEYWORDS = [
    'react', 'node', 'express', 'mongodb', 'mern', 'javascript', 
    'typescript', 'fullstack', 'frontend', 'backend', 'api', 
    'rest', 'graphql', 'docker', 'aws', 'cloud', 'architecture',
    'system design', 'agile', 'scrum', 'leadership'
];

exports.analyzeResume = async (req, res) => {
    try {
        if (!req.file || !req.file.buffer) {
            return res.status(400).json({ success: false, message: 'No valid document source provided for analysis.' });
        }

        const buffer = req.file.buffer;
        let textContent = '';
        let debugInfo = { mimeType: req.file.mimetype, fileSize: buffer.length };

        try {
            if (req.file.mimetype === 'application/pdf') {
                // Enhanced PDF parsing with potential fallback
                const pdfData = await pdfParse(buffer).catch(err => {
                    console.error('PDF Parse Error:', err);
                    throw new Error('PDF structure is corrupted or contains only images/scans.');
                });
                textContent = pdfData.text || '';
            } else if (req.file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
                const docData = await mammoth.extractRawText({ buffer });
                textContent = docData.value || '';
            } else if (req.file.mimetype === 'text/plain') {
                textContent = buffer.toString('utf-8');
            } else {
                return res.status(400).json({ success: false, message: 'Unsupported file format. Please upload PDF, DOCX, or TXT.' });
            }

            debugInfo.extractedLength = textContent.trim().length;

            if (!textContent || textContent.trim().length < 50) {
                return res.status(422).json({ 
                    success: false, 
                    message: 'Opaque Document: Could not extract sufficient text structure.',
                    debug: `Extracted ${textContent.trim().length} characters. This usually happens with scanned PDFs or images. Please use a searchable PDF or TXT file.`,
                    debugInfo
                });
            }
            textContent = textContent.toLowerCase();
        } catch (e) {
            return res.status(422).json({ 
                success: false, 
                message: `Parsing Failure: ${e.message}`,
                debugInfo
            });
        }

        // Heuristic processing: count matches
        let matchCount = 0;
        let matchedKeywords = [];
        
        TARGET_KEYWORDS.forEach(kw => {
            if (textContent.includes(kw)) {
                matchCount++;
                matchedKeywords.push(kw);
            }
        });

        // Score calculation (Heuristic: 10 keywords = 100%)
        const score = Math.min(100, Math.floor((matchCount / 10) * 100));

        let status = 'Not Shortlisted';
        let color = 'rose'; // Tailwind logical color
        let matchDescription = 'Candidate lacks specific core stack experience required for this domain.';
        let recommendation = 'Focus on candidates with closer tech stack alignment.';

        if (score >= 60) {
            status = 'Shortlisted';
            color = 'emerald';
            matchDescription = `Candidate shows strong expertise in required domains: ${matchedKeywords.slice(0, 4).join(', ')}.`;
            recommendation = 'Proceed to technical screening.';
        } else if (score >= 40) {
            status = 'Under Review';
            color = 'amber';
            matchDescription = 'Candidate has partial matching skills. May require deeper evaluation.';
            recommendation = 'Conduct introductory call to verify capabilities.';
        }

        res.status(200).json({
            success: true,
            data: {
                status,
                score,
                color,
                match: matchDescription,
                recommendation,
                parsedKeywords: matchedKeywords.length,
                isEphemeral: true,
                debugInfo
            }
        });

    } catch (err) {
        console.error('ATS System Error:', err);
        res.status(500).json({ 
            success: false, 
            message: 'Ecosystem Analysis Protocol Failure: ' + (err.message || 'Unknown parsing error')
        });
    }
};
