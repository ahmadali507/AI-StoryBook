"use strict";
/**
 * Text Generation for Age-Appropriate Storybooks
 *
 * This module provides text complexity settings and prompts for different age ranges.
 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateMVPStoryOutline = generateMVPStoryOutline;
exports.generatePageText = generatePageText;
exports.generateCoverElements = generateCoverElements;
exports.generateBackCoverSummary = generateBackCoverSummary;
exports.generateCharacterVisualDescription = generateCharacterVisualDescription;
exports.generateIllustrationPromptForScene = generateIllustrationPromptForScene;
exports.getNegativePrompt = getNegativePrompt;
exports.generateCoverIllustrationPrompt = generateCoverIllustrationPrompt;
var generative_ai_1 = require("@google/generative-ai");
var storybook_1 = require("@/types/storybook");
var genAI = new generative_ai_1.GoogleGenerativeAI(process.env.GEMINI_API_KEY);
var model = genAI.getGenerativeModel({ model: 'gemini-3-flash-preview' });
// Dedicated model for detailed visual descriptions (User Request: gemini 3.0 flash preview)
var modelCharacterDesc = genAI.getGenerativeModel({ model: 'gemini-3-flash-preview' });
// ============================================
// HELPER: RETRY LOGIC FOR API CALLS
// ============================================
function generateWithRetry(operation_1) {
    return __awaiter(this, arguments, void 0, function (operation, maxRetries, initialDelay) {
        var lastError, _loop_1, attempt, state_1;
        var _a, _b, _c;
        if (maxRetries === void 0) { maxRetries = 3; }
        if (initialDelay === void 0) { initialDelay = 2000; }
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    _loop_1 = function (attempt) {
                        var _e, error_1, isRateLimit, isServerError, delay_1;
                        return __generator(this, function (_f) {
                            switch (_f.label) {
                                case 0:
                                    _f.trys.push([0, 2, , 4]);
                                    _e = {};
                                    return [4 /*yield*/, operation()];
                                case 1: return [2 /*return*/, (_e.value = _f.sent(), _e)];
                                case 2:
                                    error_1 = _f.sent();
                                    lastError = error_1;
                                    isRateLimit = ((_a = error_1.message) === null || _a === void 0 ? void 0 : _a.includes('429')) || error_1.status === 429 || ((_b = error_1.message) === null || _b === void 0 ? void 0 : _b.includes('Too Many Requests'));
                                    isServerError = ((_c = error_1.message) === null || _c === void 0 ? void 0 : _c.includes('500')) || error_1.status === 500;
                                    if (!isRateLimit && !isServerError) {
                                        throw error_1; // Don't retry for other errors (e.g. invalid prompt)
                                    }
                                    if (attempt === maxRetries - 1) {
                                        console.error("[generateWithRetry] All ".concat(maxRetries, " attempts failed. Last error:"), error_1);
                                        throw error_1;
                                    }
                                    delay_1 = initialDelay * Math.pow(2, attempt);
                                    console.log("[generateWithRetry] Attempt ".concat(attempt + 1, " failed (").concat(isRateLimit ? 'Rate Limit' : 'Error', "). Retrying in ").concat(delay_1, "ms..."));
                                    return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, delay_1); })];
                                case 3:
                                    _f.sent();
                                    return [3 /*break*/, 4];
                                case 4: return [2 /*return*/];
                            }
                        });
                    };
                    attempt = 0;
                    _d.label = 1;
                case 1:
                    if (!(attempt < maxRetries)) return [3 /*break*/, 4];
                    return [5 /*yield**/, _loop_1(attempt)];
                case 2:
                    state_1 = _d.sent();
                    if (typeof state_1 === "object")
                        return [2 /*return*/, state_1.value];
                    _d.label = 3;
                case 3:
                    attempt++;
                    return [3 /*break*/, 1];
                case 4: throw lastError;
            }
        });
    });
}
function generateMVPStoryOutline(characters, ageRange, theme, customTitle, description, // User context/details
subject // Specific story subject/activity
) {
    return __awaiter(this, void 0, void 0, function () {
        var characterList, complexity, ageInfo, titleInstruction, prompt, result, text, jsonMatch;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    characterList = characters.map(function (c, i) {
                        var roleDesc = c.storyRole ? " [STORY ROLE: ".concat(c.storyRole, "]") : '';
                        var focusTag = c.role === 'main' ? ' [STORY FOCUS — the story is told through this character\'s perspective]' : '';
                        var details = "- ".concat(c.name, " (").concat(c.entityType, ", ").concat(c.gender, ")").concat(roleDesc).concat(focusTag);
                        if (c.description)
                            details += ": ".concat(c.description);
                        if (c.clothingStyle)
                            details += " (Wearing: ".concat(c.clothingStyle, ")");
                        return details;
                    }).join('\n');
                    complexity = storybook_1.TEXT_COMPLEXITY[ageRange];
                    ageInfo = storybook_1.AGE_RANGE_LABELS[ageRange];
                    titleInstruction = customTitle
                        ? "use the provided title \"".concat(customTitle, "\" exactly.")
                        : "create a short, engaging title (3-8 words). The title must be a single string, NO synopsis, NO outline summary. Just the title suitable for a book cover.";
                    prompt = "Create a children's storybook outline with exactly 12 scenes.\n\nTARGET AUDIENCE: Children aged ".concat(ageRange, " years old (").concat(ageInfo.label, ")\nWRITING STYLE: ").concat(complexity.style, "\nWORDS PER PAGE: Maximum ").concat(complexity.wordsPerPage, " words\n\nTHEME (Atmosphere/Setting): ").concat(theme, "\n").concat(subject ? "STORY SUBJECT (Central Plot/Activity): ".concat(subject) : '', "\n").concat(description ? "USER CONTEXT: \"".concat(description, "\"\nCRITICAL INSTRUCTION: The story must revolve around the \"STORY SUBJECT\" while incorporating the \"USER CONTEXT\" details naturally.") : '', "\n\nCHARACTERS:\n").concat(characterList, "\n\nCHARACTER IMPORTANCE RULES:\n- ALL characters are equally important and should have equal presence, dialogue, actions, and development across the story.\n- The character marked [STORY FOCUS] is the story's LOCUS \u2014 the narrative is told from their perspective and the plot revolves around their journey/experience.\n- Being the focus does NOT mean other characters are less important. Every character should be deeply woven into the story with their own voice, personality, and meaningful contributions.\n- Think of it like an ensemble cast where the camera follows one character \u2014 but every character matters equally.\n\nSTORY REQUIREMENTS:\n- Create a ").concat(theme, "-themed story\n- The story is experienced through the focus character's eyes, but all characters drive the plot equally\n- Each scene should feature multiple characters interacting meaningfully\n- Each scene should have a clear visual moment for illustration\n- End with a positive, loving conclusion\n- ").concat(ageRange === '0-2' ? 'Use lots of sound words, repetition, and simple concepts' : '', "\n- ").concat(ageRange === '2-4' ? 'Use simple sentences, familiar concepts, and gentle rhythm' : '', "\n- ").concat(ageRange === '5-8' ? 'Include dialogue, adventure elements, and clear plot progression' : '', "\n- ").concat(ageRange === '9-12' ? 'Include character development, richer vocabulary, and meaningful themes' : '', "\n\nROLE ENFORCEMENT \u2014 MANDATORY:\nEach character has a defined STORY ROLE (e.g. \"father\", \"big sister\", \"best friend\"). You MUST use the exact role provided for each character.\n- If a character's STORY ROLE is \"father\", they MUST be referred to and treated as the father in EVERY scene. Never change them to \"uncle\", \"friend\", \"brother\", or any other relationship.\n- The STORY ROLE is non-negotiable and must remain consistent across all 12 scenes.\n- Characters without a specified role should be referred to by their name and main/supporting designation.\n\nRespond in strict JSON format:\n{\n  \"title\": \"").concat(customTitle || 'The exact title of the book', "\",\n  \"dedication\": \"A short, heartfelt dedication message (1 sentence)\",\n  \"scenes\": [\n    {\n      \"number\": 1,\n      \"title\": \"Scene title\",\n      \"summary\": \"What happens in this scene (1-2 sentences)\",\n      \"sceneDescription\": \"Visual description for illustration\",\n      \"emotionalTone\": \"happy/excited/curious/loving/brave/peaceful\"\n    }\n  ]\n}\n\nCreate exactly 12 scenes. Make sure the story flows naturally from scene to scene.\nCRITICAL FOR TITLE: ").concat(titleInstruction, "\n");
                    return [4 /*yield*/, generateWithRetry(function () { return model.generateContent(prompt); })];
                case 1:
                    result = _a.sent();
                    text = result.response.text();
                    jsonMatch = text.match(/\{[\s\S]*\}/);
                    if (!jsonMatch) {
                        throw new Error('Failed to parse story outline from AI response');
                    }
                    return [2 /*return*/, JSON.parse(jsonMatch[0])];
            }
        });
    });
}
function generatePageText(sceneOutline, characters, ageRange, allPreviousScenes, storyOutline) {
    return __awaiter(this, void 0, void 0, function () {
        var complexity, ageInfo, characterNames, roleEnforcement, storyContext, sceneSummaries, upcomingContext, currentIndex, nextScene, prompt, result, text, jsonMatch;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    complexity = storybook_1.TEXT_COMPLEXITY[ageRange];
                    ageInfo = storybook_1.AGE_RANGE_LABELS[ageRange];
                    characterNames = characters.map(function (c) {
                        var label = "".concat(c.name, " (").concat(c.role, ")");
                        if (c.storyRole)
                            label = "".concat(c.name, " (").concat(c.storyRole, ")");
                        if (c.role === 'main')
                            label += ' [STORY FOCUS]';
                        return label;
                    }).join(', ');
                    roleEnforcement = characters
                        .filter(function (c) { return c.storyRole; })
                        .map(function (c) { return "- ".concat(c.name, "'s role is ").concat(c.storyRole.toUpperCase(), ". Do not change this relationship."); })
                        .join('\n');
                    storyContext = '';
                    if (allPreviousScenes && allPreviousScenes.length > 0) {
                        sceneSummaries = allPreviousScenes.map(function (s, i) {
                            return "Scene ".concat(i + 1, " \"").concat(s.sceneTitle, "\": ").concat(s.text.substring(0, 120), "...");
                        }).join('\n');
                        storyContext = "\nSTORY SO FAR (".concat(allPreviousScenes.length, " scenes completed):\n").concat(sceneSummaries, "\n\nPREVIOUS PAGE (full text for flow continuity):\n\"").concat(allPreviousScenes[allPreviousScenes.length - 1].text, "\"\n");
                    }
                    else {
                        storyContext = '\nThis is the OPENING of the story. Set the scene and introduce all the characters.';
                    }
                    upcomingContext = '';
                    if (storyOutline) {
                        currentIndex = storyOutline.scenes.findIndex(function (s) { return s.number === sceneOutline.number; });
                        if (currentIndex >= 0 && currentIndex < storyOutline.scenes.length - 1) {
                            nextScene = storyOutline.scenes[currentIndex + 1];
                            upcomingContext = "\nNEXT SCENE PREVIEW (for smooth transition): \"".concat(nextScene.title, "\" - ").concat(nextScene.summary);
                        }
                        else if (currentIndex === storyOutline.scenes.length - 1) {
                            upcomingContext = '\nThis is the FINAL scene. Wrap up the story with a satisfying, heartfelt conclusion.';
                        }
                    }
                    prompt = "Write the text for a single page of a children's storybook.\n\nTARGET AUDIENCE: Children aged ".concat(ageRange, " years old (").concat(ageInfo.label, ")\nWRITING STYLE: ").concat(complexity.style, "\nVOCABULARY LEVEL: ").concat(complexity.vocabulary, " \u2014 use SIMPLE, easy-to-read words throughout\nTARGET WORD COUNT: ").concat(complexity.wordsPerPage, " words (THIS IS IMPORTANT - write close to this amount)\n\nCURRENT SCENE (").concat(sceneOutline.number, " of ").concat((storyOutline === null || storyOutline === void 0 ? void 0 : storyOutline.scenes.length) || 12, "): ").concat(sceneOutline.title, "\n").concat(sceneOutline.summary, "\nEMOTIONAL TONE: ").concat(sceneOutline.emotionalTone, "\nCHARACTERS IN SCENE: ").concat(characterNames, "\n").concat(roleEnforcement ? "\nMANDATORY ROLE ENFORCEMENT:\n".concat(roleEnforcement) : '', "\n").concat(storyContext, "\n").concat(upcomingContext, "\n\nCRITICAL INSTRUCTIONS:\n- The character marked [STORY FOCUS] is the narrative lens \u2014 the story is told from their perspective.\n- However, ALL characters are equally important. Give every character meaningful actions, dialogue, and emotional presence.\n- No character should feel secondary or like a sidekick \u2014 they all matter equally, the focus character is just where the camera follows.\n- This scene MUST flow directly from the previous scene. Do NOT restart or repeat what already happened.\n- Continue the narrative naturally \u2014 the reader should feel like they are turning pages of one connected story.\n- Do NOT introduce new plot elements that contradict what happened before.\n- Build on the emotional arc established in previous scenes.\n").concat(ageRange === '0-2' ? "\n- Use 1-5 simple words or short phrases\n- Include sound words like \"splash!\", \"boom!\", \"whoosh!\"\n- Repetition is great: \"The ball went up, up, up!\"\n- Focus on sensory experiences\n" : '', "\n").concat(ageRange === '2-4' ? "\n- Use 15-25 simple words\n- Short, complete sentences\n- Familiar, everyday vocabulary\n- Light rhyming is nice but not required\n" : '', "\n").concat(ageRange === '5-8' ? "\n- Write 80-120 words - this is essential for a real book feel\n- Include engaging dialogue between characters\n- Use vivid sensory descriptions (what characters see, hear, feel)\n- Show character emotions through actions and expressions\n- Create tension and curiosity to keep young readers engaged\n- Use a mix of short and longer sentences for rhythm\n- The text should feel substantial, like a real published children's book\n" : '', "\n").concat(ageRange === '9-12' ? "\n- Write 150-200 words - this is essential for a chapter book feel\n- Use SIMPLE, beginner-level vocabulary. Every word should be easy for a pre-teen to read.\n- Keep sentences SHORT and CLEAR. No complex sentence structures.\n- Show character thoughts, feelings, and emotions\n- Include dialogue that reveals character personality\n- Balance action with reflection and description\n- The text should be engaging and easy to follow\n" : '', "\n\nRespond in JSON format:\n{\n  \"text\": \"The page text exactly as it should appear in the book\",\n  \"visualPrompt\": \"Detailed visual description for the illustration based on the text. Describe the exact setting, character positions, actions, and mood. Give ALL characters meaningful positions and actions.\"\n}");
                    return [4 /*yield*/, generateWithRetry(function () { return model.generateContent(prompt); })];
                case 1:
                    result = _a.sent();
                    text = result.response.text();
                    jsonMatch = text.match(/\{[\s\S]*\}/);
                    if (!jsonMatch) {
                        throw new Error('Failed to parse page text from AI response');
                    }
                    return [2 /*return*/, JSON.parse(jsonMatch[0])];
            }
        });
    });
}
// ============================================
// COVER TEXT GENERATION
// ============================================
function generateCoverElements(title, mainCharacter, theme) {
    return __awaiter(this, void 0, void 0, function () {
        var prompt, result, text, jsonMatch;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    prompt = "Create optional cover text elements for a personalized children's storybook.\n\nTITLE: ".concat(title, "\nMAIN CHARACTER: ").concat(mainCharacter.name, "\nTHEME: ").concat(theme, "\n\nCreate a short subtitle and tagline that would work on a book cover.\nKeep it simple and heartwarming.\n\nRespond in JSON format:\n{\n  \"subtitle\": \"Optional subtitle (5-8 words max, or null)\",\n  \"tagline\": \"Optional tagline for back cover (10-15 words, or null)\"\n}");
                    return [4 /*yield*/, generateWithRetry(function () { return model.generateContent(prompt); })];
                case 1:
                    result = _a.sent();
                    text = result.response.text();
                    jsonMatch = text.match(/\{[\s\S]*\}/);
                    if (!jsonMatch) {
                        return [2 /*return*/, {}];
                    }
                    return [2 /*return*/, JSON.parse(jsonMatch[0])];
            }
        });
    });
}
// ============================================
// BACK COVER SUMMARY
// ============================================
function generateBackCoverSummary(title, storyOutline, characters, ageRange) {
    return __awaiter(this, void 0, void 0, function () {
        var complexity, prompt, result;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    complexity = storybook_1.TEXT_COMPLEXITY[ageRange];
                    prompt = "Write a brief back cover summary for this children's storybook.\n\nTITLE: ".concat(title, "\nCHARACTERS: ").concat(characters.map(function (c) { return "".concat(c.name).concat(c.storyRole ? " (".concat(c.storyRole, ")") : ''); }).join(', '), "\nSTORY OVERVIEW: ").concat(storyOutline.scenes.slice(0, 3).map(function (s) { return s.summary; }).join(' '), "\n\nTARGET AUDIENCE: Children aged ").concat(ageRange, "\nMAXIMUM WORDS: ").concat(Math.min(complexity.wordsPerPage * 2, 100), "\n\nWrite an engaging summary that:\n- Introduces the characters and their relationships\n- Hints at the adventure without spoilers\n- Creates excitement to read the book\n- Ends with an inviting question or statement\n\nReturn ONLY the summary text, no JSON.");
                    return [4 /*yield*/, generateWithRetry(function () { return model.generateContent(prompt); })];
                case 1:
                    result = _a.sent();
                    return [2 /*return*/, result.response.text().trim()];
            }
        });
    });
}
/**
 * Generate a detailed visual description for a character to ensure consistency
 */
function generateCharacterVisualDescription(character) {
    return __awaiter(this, void 0, void 0, function () {
        var genderDesc, isAnimal, isObject, prompt, result, text, jsonMatch, parsed, e_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    genderDesc = 'character';
                    if (character.entityType === 'human') {
                        genderDesc = character.gender === 'male' ? 'boy' : character.gender === 'female' ? 'girl' : 'child';
                    }
                    else if (character.entityType === 'animal') {
                        genderDesc = character.description || 'animal';
                    }
                    else {
                        genderDesc = character.description || 'object';
                    }
                    isAnimal = character.entityType === 'animal';
                    isObject = character.entityType === 'object';
                    prompt = "";
                    if (isAnimal) {
                        prompt = "Analyze this ANIMAL character and create a detailed visual description for illustration consistency.\n\nCHARACTER: ".concat(character.name, "\nTYPE: ").concat(character.entityType, "\nGENDER: ").concat(character.gender, "\nDESCRIPTION: ").concat(character.description || '', "\n").concat(!character.clothingStyle ? "CLOTHING: NO CLOTHING. Natural appearance only." : "CLOTHING: ".concat(character.clothingStyle), "\n\nCreate a detailed visual description for a Pixar-style 3D animated movie.\nFocus on: Fur/skin texture, body shape, distinct markings, ears, tail, and expression.\n\nCRITICAL CONSTRAINTS for ANIMALS:\n- Do NOT describe human features (no \"blonde hair\", no \"fair skin\", no \"human hands\").\n- Use terms like \"fur\", \"scales\", \"feathers\", \"snout\", \"paws\".\n- Keep the description focused purely on the animal's physical traits.\n- If the user provided a description (").concat(character.description, "), prioritise those details (e.g. \"Dalmatian\", \"Golden Retriever\").\n- ").concat(!character.clothingStyle ? "Ensure the visual prompt explicitly states 'no clothing' or 'natural fur'." : "Include the clothing description.", "\n\nRespond in JSON format:\n{\n  \"description\": \"A detailed 2-3 sentence description of the animal's appearance\",\n  \"consistencyKeywords\": \"comma-separated keywords: fur_color, breed, distinct_features, texture\",\n  \"visualPrompt\": \"A concise, comma-separated visual description string optimized for image generation (e.g. 'golden retriever puppy, fluffy golden fur, floppy ears, happy expression, red collar')\"\n}");
                    }
                    else if (isObject) {
                        prompt = "Analyze this OBJECT character and create a detailed visual description.\n\nCHARACTER: ".concat(character.name, "\nTYPE: ").concat(character.entityType, "\nDESCRIPTION: ").concat(character.description || '', "\n\nCreate a detailed visual description for a Pixar-style 3D animated movie.\nFocus on: Material, texture, shape, color, and anthropomorphic features if applicable (eyes, mouth).\n\nRespond in JSON format:\n{\n  \"description\": \"A detailed description of the object\",\n  \"consistencyKeywords\": \"comma-separated keywords: material, color, shape\",\n  \"visualPrompt\": \"concise visual description\"\n}");
                    }
                    else {
                        // HUMAN PROMPT
                        prompt = "Analyze this HUMAN character and create a detailed visual description for illustration consistency.\n\nCHARACTER: ".concat(character.name, "\nTYPE: ").concat(character.entityType, "\nGENDER: ").concat(character.gender, "\nAGE: ").concat(character.age || 'Unspecified', "\nROLE: ").concat(character.storyRole || 'Unspecified', "\nDESCRIPTION: ").concat(character.description || '', "\n\nCreate a detailed visual description for a Pixar-style 3D animated movie.\nFocus on permanent visual features: hair, eyes, skin tone, face shape.\n\nCRITICAL: accurately reflect the body type from reference photos.\n- Do NOT describe characters as \"muscular\", \"ripped\", or \"athletic\" unless explicitly stated.\n- For children, use terms like \"child-like\", \"small\", \"cute\".\n- For average adults, use \"average build\", \"slim\", or \"soft features\".\n\nRespond in JSON format:\n{\n  \"description\": \"A detailed 2-3 sentence description including age, hair, eyes, skin, face shape\",\n  \"consistencyKeywords\": \"comma-separated keywords: hair_color, eye_color, skin_tone, clothing_style\",\n  \"visualPrompt\": \"A concise, comma-separated visual description string\"\n}");
                    }
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, generateWithRetry(function () { return modelCharacterDesc.generateContent(prompt); })];
                case 2:
                    result = _a.sent();
                    text = result.response.text();
                    jsonMatch = text.match(/\{[\s\S]*\}/);
                    if (jsonMatch) {
                        parsed = JSON.parse(jsonMatch[0]);
                        return [2 /*return*/, {
                                name: character.name,
                                description: parsed.description,
                                consistencyKeywords: parsed.consistencyKeywords,
                                visualPrompt: parsed.visualPrompt || parsed.consistencyKeywords
                            }];
                    }
                    return [3 /*break*/, 4];
                case 3:
                    e_1 = _a.sent();
                    console.error('Failed to generate character description:', e_1);
                    return [3 /*break*/, 4];
                case 4: 
                // Fallback description
                return [2 /*return*/, {
                        name: character.name,
                        description: "".concat(character.name, ", a ").concat(genderDesc, " character"),
                        consistencyKeywords: "".concat(genderDesc, ", friendly expression, natural look"),
                        visualPrompt: "".concat(genderDesc, ", friendly expression, natural look")
                    }];
            }
        });
    });
}
// Pixar 3D Cinematic quality boosters
var PIXAR_3D_QUALITY = "\nPixar style 3D cinematic scene, high quality 3D render, ultra detailed,\nglobal illumination, soft shadows, depth of field, warm tones,\ncinematic composition, volumetric lighting, subsurface scattering,\nprofessional Pixar/Disney quality animation, octane render, ray tracing\n".trim().replace(/\n/g, ' ');
var PIXAR_3D_NEGATIVE = "\n2D, flat, cartoon, anime, sketch, drawing, painting, illustration,\nlow quality, blurry, pixelated, bad anatomy, distorted features,\ntext, words, logos, watermark, signature, ugly, deformed,\nextra limbs, missing limbs, bad proportions, gross proportions\n".trim().replace(/\n/g, ' ');
// Photorealistic quality boosters (keeping for backwards compatibility)
var PHOTOREALISTIC_QUALITY = "\nphotorealistic, hyperrealistic, 8k resolution, professional photography,\ncinematic lighting with soft key light and fill light, shallow depth of field,\nnatural skin textures with subtle imperfections, realistic eye reflections and catchlights,\nsubsurface scattering on skin, detailed hair strands, volumetric lighting,\nshot on Sony A7R IV, 85mm lens, f/1.8 aperture, golden hour lighting\n".trim().replace(/\n/g, ' ');
var PHOTOREALISTIC_NEGATIVE = "\ncartoon, anime, illustration, painting, drawing, sketch, artwork,\nplastic skin, mannequin-like, uncanny valley, artificial, CGI look,\noversaturated colors, unrealistic lighting, flat lighting,\nbad anatomy, distorted features, extra limbs, missing limbs,\nblurry, low quality, pixelated, text, watermark, signature\n".trim().replace(/\n/g, ' ');
/**
 * Generate a structured illustration prompt with character references and actions
 * Uses Pixar 3D cinematic style by default for best quality
 */
/**
 * Generate a structured illustration prompt with character references and actions
 * Uses the user's professional structured format
 */
function generateIllustrationPromptForScene(scene, characters, artStyle, globalSeed, characterDescriptions, generatedVisualPrompt) {
    return __awaiter(this, void 0, void 0, function () {
        var actionPrompt, setting, lighting, charActions, result, text, jsonMatch, parsed, e_2, finalPrompt;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    actionPrompt = "You are an expert art director for a Pixar-style 3D animated movie.\n    \nSCENE CONTEXT:\n".concat(generatedVisualPrompt || scene.sceneDescription, "\nEMOTIONAL TONE: ").concat(scene.emotionalTone, "\n\nCHARACTERS IN SCENE:\n").concat(characters.map(function (c, i) {
                        var clothingNote;
                        if (c.useFixedClothing && !c.clothingStyle) {
                            clothingNote = "WEARING EXACT SAME CLOTHING AS IN REFERENCE IMAGE (Do not change or describe clothing)";
                        }
                        else if (c.clothingStyle) {
                            clothingNote = "FIXED OUTFIT: ".concat(c.clothingStyle, " (DO NOT change this outfit across scenes)");
                        }
                        else {
                            clothingNote = "WEARING SCENE-APPROPRIATE CLOTHING (Describe their outfit matching the scene/theme)";
                        }
                        // Critical: Strict species definition
                        var speciesDef = c.entityType === 'human'
                            ? "HUMAN (".concat(c.gender, ")")
                            : "NON-HUMAN ANIMAL (".concat(c.description || c.entityType, ")");
                        var roleLabel = c.storyRole ? "role: ".concat(c.storyRole) : "role: ".concat(c.role);
                        return "- ".concat(c.name, " [").concat(speciesDef, "] (").concat(roleLabel, ") - ").concat(clothingNote);
                    }).join('\n'), "\n\nTask: Describe the EXACT ACTION and POSE for each character in this specific scene.\n\nCRITICAL INSTRUCTIONS:\n1. **NO STATIC POSES**: Do NOT describe characters as just \"standing\", \"posing\", or \"looking at the camera\". \n   - Characters MUST be DOING something related to the scene.\n   - BANNED PHRASES: \"standing in front of\", \"posing for a photo\", \"smiling at the viewer\".\n\n2. **PHYSICAL INTERACTION (MANDATORY)**: Characters must physically interact with the environment.\n   - Examples: \"sitting on the mossy rock\", \"leaning against the tree\", \"holding a glowing lantern\", \"feet splashing in the puddle\", \"reaching for the apple\".\n   - Connect the character to the background elements.\n\n3. **NO SPECIES HALLUCINATION**: Respect \"NON-HUMAN ANIMAL\" definitions exactly.\n   - If a character is a \"Golden Retriever\", DO NOT describe them as a \"fox\" or anything else.\n\n4. **ACTION ONLY**: Describe *only* what the character is DOING.\n   - DO NOT re-describe their appearance.\n   - START with the action verb or name: \"Tom jumps over the log...\"\n\nRespond in JSON format:\n{\n  \"setting\": \"Detailed description of the environment/background only (NO characters). Focus on lighting, atmosphere, and small details.\",\n  \"lighting\": \"Cinematic lighting description (e.g., 'Soft volumetric lighting, warm candlelight, deep shadows')\",\n  \"characterActions\": [\n    {\n      \"name\": \"").concat((_a = characters[0]) === null || _a === void 0 ? void 0 : _a.name, "\",\n      \"action\": \"Specific action/pose ONLY. Must involve physical interaction with the scene.\"\n    }\n    // ... for other characters\n  ]\n}");
                    setting = scene.sceneDescription;
                    lighting = "Cinematic framing, soft volumetric lighting, realistic global illumination, subtle depth of field, shallow focus on the main subject, warm color palette, high contrast between light and shadow, filmic atmosphere, naturalistic reflections.";
                    charActions = [];
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, generateWithRetry(function () { return model.generateContent(actionPrompt); })];
                case 2:
                    result = _b.sent();
                    text = result.response.text();
                    jsonMatch = text.match(/\{[\s\S]*\}/);
                    if (jsonMatch) {
                        parsed = JSON.parse(jsonMatch[0]);
                        if (parsed.setting)
                            setting = parsed.setting;
                        if (parsed.lighting)
                            lighting = parsed.lighting + ", realistic global illumination, subtle depth of field.";
                        if (parsed.characterActions && Array.isArray(parsed.characterActions)) {
                            charActions.push.apply(charActions, parsed.characterActions);
                        }
                    }
                    return [3 /*break*/, 4];
                case 3:
                    e_2 = _b.sent();
                    console.error('Failed to generate character actions:', e_2);
                    // Fallback: generic actions
                    characters.forEach(function (c) {
                        charActions.push({
                            name: c.name,
                            action: 'Standing in the scene, engaged and interacting'
                        });
                    });
                    return [3 /*break*/, 4];
                case 4:
                    finalPrompt = "[SCENE]\n\n";
                    finalPrompt += "Pixar-style 3D cinematic scene. ".concat(setting, ". The mood is ").concat(scene.emotionalTone, ".\n\n");
                    finalPrompt += "[COMPOSITION & LIGHTING]\n\n";
                    finalPrompt += "".concat(lighting, "\n\n");
                    finalPrompt += "[CHARACTER ACTIONS]\n\n";
                    characters.forEach(function (char, index) {
                        var _a, _b;
                        var action = ((_a = charActions.find(function (a) { return a.name === char.name; })) === null || _a === void 0 ? void 0 : _a.action) ||
                            "in the scene with ".concat(scene.emotionalTone, " expression");
                        // Create visual anchors for the character
                        var visualComponents = [];
                        // Entity type is critical for model understanding
                        visualComponents.push("[".concat(char.entityType.toUpperCase(), "]"));
                        if (char.gender)
                            visualComponents.push(char.gender);
                        if (char.age)
                            visualComponents.push("".concat(char.age, " years old"));
                        if (char.storyRole)
                            visualComponents.push("Role: ".concat(char.storyRole));
                        if (char.description)
                            visualComponents.push("Species/Desc: ".concat(char.description));
                        // Add specific visual descriptors if available
                        var visualDesc = (_b = characterDescriptions === null || characterDescriptions === void 0 ? void 0 : characterDescriptions.find(function (d) { return d.name === char.name; })) === null || _b === void 0 ? void 0 : _b.visualPrompt;
                        if (visualDesc)
                            visualComponents.push("Visual traits: ".concat(visualDesc));
                        var visualAnchors = visualComponents.length > 0 ? " \u2014 ".concat(visualComponents.join(', ')) : '';
                        // Strict clothing enforcement
                        var clothingInstruction = "";
                        if (char.clothingStyle) {
                            clothingInstruction = "WEARING: ".concat(char.clothingStyle, ". (Keep outfit consistent).");
                        }
                        else if (char.entityType === 'animal') {
                            // Critical for animals: explicit "no clothing" if none provided
                            clothingInstruction = "WEARING: NO CLOTHING. Natural fur/skin only.";
                        }
                        else {
                            clothingInstruction = "WEARING: Scene-appropriate casual clothing.";
                        }
                        // EXACT TEMPLATE MATCH: 
                        // Character N (Name) — FIXED APPEARANCE (reference image N) — [Anchors]
                        // CLOTHING: [Instruction]
                        // ACTION IN THIS SCENE:
                        // [Action Text]
                        finalPrompt += "Character ".concat(index + 1, " (").concat(char.name, ") \u2014 FIXED APPEARANCE (reference image ").concat(index + 1, ")").concat(visualAnchors, "\n");
                        finalPrompt += "".concat(clothingInstruction, "\n");
                        finalPrompt += "ACTION IN THIS SCENE:\n";
                        finalPrompt += "".concat(action, "\n\n");
                    });
                    finalPrompt += "[RENDER DEFAULT]\n\n";
                    finalPrompt += "High-quality 3D render, ultra-detailed textures, physically accurate global illumination, realistic volumetric light, cinematic camera lens, photorealistic materials, clean composition. No text, no logos.";
                    return [2 /*return*/, finalPrompt];
            }
        });
    });
}
/**
 * Get the negative prompt for image generation based on art style
 */
function getNegativePrompt(artStyle) {
    var isPixar3D = artStyle.toLowerCase().includes('pixar') ||
        artStyle.toLowerCase().includes('3d') ||
        artStyle.toLowerCase().includes('cinematic') ||
        artStyle.toLowerCase().includes('soft-illustration') ||
        artStyle.toLowerCase().includes('modern-cartoon');
    var isPhotorealistic = artStyle.toLowerCase().includes('photorealistic') ||
        artStyle.toLowerCase().includes('realistic');
    if (isPixar3D) {
        return PIXAR_3D_NEGATIVE;
    }
    if (isPhotorealistic) {
        return PHOTOREALISTIC_NEGATIVE;
    }
    return 'blurry, bad quality, distorted, text, words, letters, low resolution, pixelated';
}
// ============================================
// COVER ILLUSTRATION PROMPT
// ============================================
function generateCoverIllustrationPrompt(title, characters, theme, artStyle, characterDescriptions, characterImageCounts // Optional: How many images per character
) {
    return __awaiter(this, void 0, void 0, function () {
        var coverActionPrompt, setting, lighting, charActions, result, text, jsonMatch, parsed, e_3, finalPrompt;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    coverActionPrompt = "You are an expert art director for a Pixar-style 3D animated movie.\n    \n    Task: Design the COVER ART for a children's book.\n    TITLE: ".concat(title, "\n    THEME: ").concat(theme, "\n    ART STYLE: ").concat(artStyle, "\n    \n    CHARACTERS TO FEATURE (all equally prominent):\n    ").concat(characters.map(function (c) { return "- ".concat(c.name, " (").concat(c.entityType, ", ").concat(c.gender, ")").concat(c.storyRole ? " \u2014 role: ".concat(c.storyRole) : ''); }).join('\n'), "\n    \n    Design a compelling, high-quality cover composition.\n    - ALL characters should be featured prominently and equally in the composition.\n    - Their story roles (e.g. father, sister, friend) should inform their poses and positioning.\n    - **INTERACTION**: Characters must be DOING something (running, flying, holding hands, exploring), not just standing.\n    - The lighting should be magical and cinematic (Golden Hour / Volumetric).\n    - The background should clearly establish the ").concat(theme, " setting.\n    \n    Respond in JSON format:\n    {\n      \"setting\": \"Detailed background description (NO characters).\",\n      \"lighting\": \"Cinematic lighting description.\",\n      \"characterActions\": [\n        {\n          \"name\": \"").concat((_a = characters[0]) === null || _a === void 0 ? void 0 : _a.name, "\",\n          \"action\": \"Specific dynamic pose/action. interacting with the environment or other characters.\"\n        }\n        // ... other characters if present\n      ]\n    }");
                    setting = "A magical ".concat(theme, " world");
                    lighting = "Warm golden hour light, soft and inviting, volumetric rays, cinematic depth of field";
                    charActions = [];
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, generateWithRetry(function () { return model.generateContent(coverActionPrompt); })];
                case 2:
                    result = _b.sent();
                    text = result.response.text();
                    jsonMatch = text.match(/\{[\s\S]*\}/);
                    if (jsonMatch) {
                        parsed = JSON.parse(jsonMatch[0]);
                        if (parsed.setting)
                            setting = parsed.setting;
                        if (parsed.lighting)
                            lighting = parsed.lighting;
                        if (parsed.characterActions && Array.isArray(parsed.characterActions)) {
                            charActions.push.apply(charActions, parsed.characterActions);
                        }
                    }
                    return [3 /*break*/, 4];
                case 3:
                    e_3 = _b.sent();
                    console.error("Failed to generate cover actions:", e_3);
                    return [3 /*break*/, 4];
                case 4:
                    finalPrompt = "[SCENE]\n\n";
                    finalPrompt += "Pixar-style 3D cinematic book cover. ".concat(setting, ". \n\n");
                    finalPrompt += "[COMPOSITION & LIGHTING]\n\n";
                    finalPrompt += "".concat(lighting, ", 8k resolution, ultra-detailed textures, physically accurate global illumination. Portrait orientation.\n\n");
                    finalPrompt += "[CHARACTER ACTIONS]\n\n";
                    characters.forEach(function (char, index) {
                        var _a, _b;
                        var action = ((_a = charActions.find(function (a) { return a.name === char.name; })) === null || _a === void 0 ? void 0 : _a.action) ||
                            "Standing prominently in the center, smiling warmly, inviting pose";
                        // Create visual anchors for the character
                        var visualComponents = [];
                        // Entity type is critical for model understanding
                        visualComponents.push("[".concat(char.entityType.toUpperCase(), "]"));
                        if (char.gender)
                            visualComponents.push(char.gender);
                        if (char.age)
                            visualComponents.push("".concat(char.age, " years old"));
                        if (char.storyRole)
                            visualComponents.push("Role: ".concat(char.storyRole));
                        if (char.description)
                            visualComponents.push("Species/Desc: ".concat(char.description));
                        // Add specific visual descriptors if available
                        var visualDesc = (_b = characterDescriptions === null || characterDescriptions === void 0 ? void 0 : characterDescriptions.find(function (d) { return d.name === char.name; })) === null || _b === void 0 ? void 0 : _b.visualPrompt;
                        if (visualDesc)
                            visualComponents.push("Visual traits: ".concat(visualDesc));
                        var visualAnchors = visualComponents.length > 0 ? " \u2014 ".concat(visualComponents.join(', ')) : '';
                        // Strict clothing enforcement
                        var clothingInstruction = "";
                        if (char.clothingStyle) {
                            clothingInstruction = "WEARING: ".concat(char.clothingStyle, ". (Keep outfit consistent).");
                        }
                        else if (char.entityType === 'animal') {
                            // Critical for animals: explicit "no clothing" if none provided
                            clothingInstruction = "WEARING: NO CLOTHING. Natural fur/skin only.";
                        }
                        else {
                            clothingInstruction = "WEARING: Casual, friendly clothing.";
                        }
                        // EXACT TEMPLATE MATCH:
                        // Character N (Name) — FIXED APPEARANCE (reference image N) — [Anchors]
                        // CLOTHING: [Instruction]
                        // ACTION IN THIS SCENE:
                        // [Action Text]
                        finalPrompt += "Character ".concat(index + 1, " (").concat(char.name, ") \u2014 FIXED APPEARANCE (reference image ").concat(index + 1, ")").concat(visualAnchors, "\n");
                        finalPrompt += "".concat(clothingInstruction, "\n");
                        finalPrompt += "ACTION IN THIS SCENE:\n";
                        finalPrompt += "".concat(action, "\n\n");
                    });
                    finalPrompt += "[RENDER DEFAULT]\n\n";
                    finalPrompt += "High-quality 3D render, ultra-detailed textures, physically accurate global illumination, realistic volumetric light, cinematic camera lens, photorealistic materials, clean composition. No text, no logos.";
                    return [2 /*return*/, finalPrompt];
            }
        });
    });
}
