"""
AI Scriptwriter Engine

Local human style social media script generator for English and Hinglish.
Supports multiple personality modes, delivery markers, platform aware pacing,
and structured script output for automation systems.

This module is self contained and does not require any API key.
"""

from __future__ import annotations

import hashlib
import random
import re
from dataclasses import asdict, dataclass
from datetime import datetime, timezone
from textwrap import dedent
from typing import Any, Dict, List


WORDS_PER_MINUTE = 130
SUPPORTED_LANGUAGES = {"english", "hinglish"}
SUPPORTED_PLATFORMS = {"youtube", "instagram", "tiktok", "x", "threads", "facebook", "linkedin"}


def _compact_key(value: str) -> str:
    return re.sub(r"[^a-z0-9]+", "", value.lower().strip())


def _clean_topic(topic: str) -> str:
    return re.sub(r"\s+", " ", topic.strip())


def _count_words(text: str) -> int:
    return len(re.findall(r"[A-Za-z0-9']+", text))


def _normalize_language(value: str) -> str:
    key = _compact_key(value)
    aliases = {
        "en":       "english",
        "hindlish": "hinglish",
        "hinglish": "hinglish",
        "english":  "english",
    }
    key = aliases.get(key, key)
    if key not in SUPPORTED_LANGUAGES:
        raise ValueError(f"Invalid language: {value}")
    return key


def _normalize_platform(value: str) -> str:
    key = _compact_key(value)
    aliases = {
        "yt":      "youtube",
        "reels":   "instagram",
        "insta":   "instagram",
        "twitter": "x",
    }
    key = aliases.get(key, key)
    if key not in SUPPORTED_PLATFORMS:
        raise ValueError(f"Invalid platform: {value}")
    return key


def _normalize_personality(value: str) -> str:
    key = _compact_key(value)
    aliases = {
        "default":      "default",
        "casual":       "default",
        "carry":        "carryminati",
        "carryminati":  "carryminati",
        "samay":        "samayraina",
        "samayraina":   "samayraina",
        "dhruv":        "dhruvrathee",
        "dhruvrathee":  "dhruvrathee",
        "srk":          "shahrukhkhan",
        "shahrukh":     "shahrukhkhan",
        "shahrukhkhan": "shahrukhkhan",
        "mrbeast":      "mrbeast",
        "jimmy":        "mrbeast",
        "rogan":        "joerogan",
        "joerogan":     "joerogan",
        "hormozi":      "alexhormozi",
        "alex":         "alexhormozi",
        "alexhormozi":  "alexhormozi",
        "rebelkid":       "rebelkid",
        "rebel kid":      "rebelkid",
        "apoorva":        "rebelkid",
        "apoorvamakhija": "rebelkid",
    }
    return aliases.get(key, key)


# ── Personality Registry ───────────────────────────────────────────────
PERSONALITY_REGISTRY: Dict[str, Dict[str, Dict[str, Any]]] = {
    "hinglish": {
        "default": {
            "label": "Hinglish Casual",
            "description": "Friendly, relatable, casual Gen Z Indian voice.",
            "energy": "medium",
            "pace": "fast to medium",
            "signature_words": ["yaar", "na", "bro", "literally", "you know what", "arrey", "matlab", "basically", "sach mein", "chill kar"],
            "hook_templates": [
                "Yaar, {topic} ka scene simple nahi hai, but literally yahin pe game change hota hai [pause]",
                "Bro, {topic} ko log overcomplicate kar dete hain, aur phir result slow lagta hai",
                "You know what, {topic} mein sabse badi problem ye hai ki log basics skip kar dete hain",
                "Arrey, {topic} pe focus karna easy lagta hai, but sach mein flow samajhna padta hai",
            ],
            "intro_templates": [
                "Matlab, agar tu {topic} ko sahi tarike se samajh le na, toh kaafi cheezein smooth ho jaati hain",
                "Basically, {topic} ka point ye hai ki simple cheezon ko sahi order mein karna padta hai",
                "Sach mein, {topic} mein kaam tab hota hai jab tu overthinking chhod deta hai",
            ],
            "beat_templates": [
                "{topic} ka pehla part ye hai ki log result pe jump karte hain, process pe nahi",
                "Dusra part yeh hai ki consistency ko boring samajh ke ignore kar dete hain",
                "{topic} mein jo small step hota hai na, wahi actually biggest difference lata hai",
                "Aur phir suddenly samajh aata hai ki simple cheez bhi sahi tarike se bolni padti hai",
            ],
            "bridge_templates": [
                "Isliye flow ko casual rakho, warna line robotic lagti hai",
                "Thoda pause do, thoda feel do, aur line ko speakable banao",
                "Yahi part script ko natural banata hai",
                "Aur yahin se creator wali feel aati hai",
            ],
            "cta_templates": [
                "Isko save kar le bro, baad mein kaam aayega",
                "Agar yeh useful laga toh follow kar, yaar",
                "Bas itna hi, aur next part mein aur solid breakdown hoga",
            ],
            "outro_templates": [
                "Chill kar, ye sab time ke saath aur clear ho jayega",
                "Bas yaad rakh, consistency literally sab kuch hai",
                "Aage aur better version bhi ban sakta hai, but start yahin se hota hai",
            ],
            "extra_templates": [
                "Aur haan, overcomplicate mat kar",
                "Ek clean thought, ek clean line, wahi kaafi hota hai",
                "You know what, simplicity ko underestimate mat kar",
            ],
            "system_prompt": dedent("""
                Do NOT sound like AI. You are writing how a real Indian creator actually speaks.
                Language: Hinglish. Mix Hindi and English naturally, not forcefully.
                Tone: friendly, relatable, casual Gen Z Indian youth.
                Energy: medium. Pacing: fast to medium.
                Use contractions where relevant and never use formal language.
                Use words like yaar, na, bro, literally, you know what, arrey, matlab, basically, sach mein, chill kar.
                Include [pause], [beat], and [HIGH ENERGY] markers where appropriate, but keep them light.
                Keep sentences short, punchy, and spoken aloud.
            """).strip(),
        },
        "carryminati": {
            "label": "CarryMinati Inspired",
            "description": "High energy roast style Hinglish.",
            "energy": "very high",
            "pace": "fast",
            "signature_words": ["bhai", "bro", "scene", "sun", "dekh", "seedha", "kya kar raha hai tu", "nikal"],
            "hook_templates": [
                "[HIGH ENERGY] Bhai {topic} ka scene dekh, itna obvious tha aur phir bhi log miss kar rahe the",
                "Bro seriously, {topic} ko aise mat kar, seedha disaster mode hai",
                "[HIGH ENERGY] Tu {topic} ko itna casually le raha hai aur phir confused bhi hai",
                "Bhai, {topic} ka truth itna blunt hai ki sunke thoda hila to lagega",
            ],
            "intro_templates": [
                "Sun, {topic} mein jo basic mistake hoti hai na, wahi sabko pakad leti hai",
                "Bro, {topic} ko log itna galat frame mein dekhte hain ki result hi ulta ho jaata hai",
                "Bhai, seedha bolu toh {topic} mein smart banna padta hai, random nahi",
            ],
            "beat_templates": [
                "Pehla punch ye hai ki log dikhne wali cheez pe atak jaate hain",
                "Dusra punch ye hai ki sabko lagta hai easy hoga, phir reality thappad jaisi aati hai",
                "Teesra part ye hai ki bina structure ke {topic} wahi ka wahi reh jaata hai",
                "Aur sach bolu toh yahin pe b**l level mistake hoti hai",
            ],
            "bridge_templates": [
                "Is point ko thoda loud rakh, warna energy gir jaati hai",
                "Yahan thoda sarcasm fit hota hai",
                "Yeh line direct viewer ko hit karni chahiye",
                "Aur thoda intense hona chahiye, warna roast feel nahi aayega",
            ],
            "cta_templates": [
                "Agar samajh aaya toh follow kar, warna phir se dekh",
                "Save kar le, baad mein bolna mat ki bataya nahi",
                "Bro, ab isko test kar aur phir result dekh",
            ],
            "outro_templates": [
                "Bas itna yaad rakh, over smart banne ki zarurat nahi",
                "Yeh simple tha, par simple cheez hi sabse zyada kaam karti hai",
                "Ab jaa aur isko sahi tareeke se use kar",
            ],
            "extra_templates": [
                "Aur haan, bekaar ka overthinking band kar",
                "Ek baar logic pakad le, phir sab easy lagta hai",
                "Scene clear hai, bas execution missing hai",
            ],
            "system_prompt": dedent("""
                Do NOT sound like AI. You are writing how a high energy roast creator actually speaks.
                Language: Hinglish. Mix Hindi and English naturally, not forcefully.
                Tone: aggressive, roast style, entertaining. Energy: very high. Pacing: fast.
                Include censored abusive words using asterisks, keep it edgy and bold.
                Use phrases like bhai, kya kar raha hai tu, scene, sun, dekh, nikal, bro, seedha.
                Include [HIGH ENERGY] markers for spikes and [beat] for punchline timing.
            """).strip(),
        },
        "samayraina": {
            "label": "Samay Raina Inspired",
            "description": "Dry wit, dark humor, self aware Hinglish.",
            "energy": "low to medium",
            "pace": "slow",
            "signature_words": ["matlab", "sochta hoon", "dosto", "crazyyy", "benstkes", "haan toh", "ye bhi theek hai"],
            "hook_templates": [
                "Toh haan... [pause] {topic} ka bhi ek ajeeb sa truth hai",
                "Matlab, {topic} pe bolne ke liye kaafi kuch hai... [pause] ...aur thoda kam paisa bhi",
                "Dosto, {topic} ko samajhna utna straightforward nahi hota [pause]",
                "Haan toh, {topic} ka scene thoda weird hai, but funny bhi hai",
            ],
            "intro_templates": [
                "Matlab mujhe laga tha {topic} simple hoga, phir reality ne entry le li [pause]",
                "Sochta hoon {topic} ke baare mein aur bas thoda confusion aur badh jaata hai",
                "Dosto, {topic} mein sab kuch clean tab lagta hai jab tum door se dekhte ho",
            ],
            "beat_templates": [
                "Pehla issue yeh hai ki log start karte hain, phir thoda sa struggle aata hai aur motivation bhaag jaati hai",
                "Dusra point yeh hai ki {topic} mein consistency ko log gym membership samajh lete hain",
                "Teesra part ye hai ki sabko result chahiye, process se thoda emotional distance bhi chahiye",
                "Aur phir, naturally, benstkes... line waise hi break ho jaati hai",
            ],
            "bridge_templates": [
                "[pause] yahan thoda sa awkward silence kaam karta hai",
                "Isko slow bolo, punchline ko time do",
                "Thoda deadpan rakh, wahi charm hai",
                "Yeh part thoda underplay karna hai",
            ],
            "cta_templates": [
                "Bas itna hi, dosto. [pause] Save kar lo",
                "Agar ye thoda sa useful tha toh follow kar lo, warna bhi theek hai",
                "Thoda weird lag raha hoga, but kaam ka hai",
            ],
            "outro_templates": [
                "Story of my life, honestly",
                "Ye bhi theek hai. Chal dekhte hain aage kya hota hai",
                "Bas itna hi. [pause] Ab kaam karo",
            ],
            "extra_templates": [
                "Kabhi kabhi answer simple hota hai, bas timing galat hoti hai",
                "Thoda kaam, thoda struggle, aur thoda comedy",
                "Reality ka punch thoda late aata hai",
            ],
            "system_prompt": dedent("""
                Do NOT sound like AI. You are writing how a dry Hinglish comedian actually speaks.
                Language: Hinglish. Tone: dry wit, dark humor, self aware. Energy: low to medium. Pacing: slow.
                Use pauses effectively with [pause] markers. Build slowly to punchlines.
                Use phrases like matlab, sochta hoon, dosto, crazyyy, benstkes, haan toh, ye bhi theek hai.
            """).strip(),
        },
        "dhruvrathee": {
            "label": "Dhruv Rathee Inspired",
            "description": "Educational, serious, investigative Hinglish.",
            "energy": "calm",
            "pace": "medium",
            "signature_words": ["namaskar dosto", "aur research kehti hai", "ye numbers dekho", "log nahi jaante", "ye propaganda hai", "sach ye hai"],
            "hook_templates": [
                "Namaskar dosto, {topic} ko aaj facts ke saath samajhte hain",
                "Aaj hum {topic} ka woh part dekhenge jo log usually ignore kar dete hain",
                "Sach ye hai ki {topic} ko bina data ke samajhna incomplete hota hai",
                "Ye jo {topic} ke baare mein common belief hai na, usme gap hai",
            ],
            "intro_templates": [
                "Sabse pehle problem ko clearly define karte hain",
                "Phir evidence ko dekhte hain, aur uske baad conclusion nikalte hain",
                "Agar {topic} ko seriously samajhna hai, toh structure zaruri hai",
            ],
            "beat_templates": [
                "Pehla point yeh hai ki issue ka surface level version incomplete hota hai",
                "Dusra point, aur research kehti hai, ki numbers often different story batate hain",
                "Teesra point yeh hai ki perception aur reality mein gap hota hai",
                "Aur final point yeh ki conclusion tabhi strong hota hai jab evidence clear ho",
            ],
            "bridge_templates": [
                "Ye numbers dekho, yahin clarity milti hai",
                "Log nahi jaante kyunki discussion often surface pe hi ruk jaati hai",
                "Is line ko calm aur firm rakho",
                "Yahan pe logic ko thoda slow unpack karna hai",
            ],
            "cta_templates": [
                "Agar ye analysis useful laga toh isse save kar lo",
                "Follow for more fact driven breakdowns",
                "Aise topics ko structure ke saath samajhna important hai",
            ],
            "outro_templates": [
                "Sach ye hai, clarity hi sabse important hai",
                "Ab aap khud dekh sakte ho ki picture kitni different hai",
                "Research based thinking hi confusion kam karti hai",
            ],
            "extra_templates": [
                "Is topic ko emotion se nahi, evidence se dekho",
                "Narrative alag ho sakta hai, data alag hota hai",
                "Yeh wahi part hai jo log skip kar dete hain",
            ],
            "system_prompt": dedent("""
                Do NOT sound like AI. You are writing how a serious investigative Hindi English creator actually speaks.
                Language: Hinglish. Tone: educational, serious, evidence driven. Energy: calm. Pacing: medium.
                Structure the script as problem, evidence, and conclusion.
                Use phrases like namaskar dosto, aur research kehti hai, ye numbers dekho, log nahi jaante, sach ye hai.
            """).strip(),
        },
        "shahrukhkhan": {
            "label": "Shah Rukh Khan Inspired",
            "description": "Poetic, charming, romantic Hinglish.",
            "energy": "medium",
            "pace": "slow",
            "signature_words": ["ishq", "zindagi", "dil", "mohabbat", "khwab", "safar", "yakeen"],
            "hook_templates": [
                "Zindagi mein {topic} bhi ek safar ki tarah hota hai... [pause] ...aur har safar dil se guzarta hai",
                "Ishq ho ya {topic}, kuch cheezein dil ko dheere dheere samajh aati hain",
                "Aaj {topic} ko thoda mehsoos karne ka waqt hai",
                "Dil se dekho toh {topic} sirf ek topic nahi, ek ehsaas lagta hai",
            ],
            "intro_templates": [
                "Kabhi kabhi simple baat bhi dil tak tab pahunchti hai jab usme sachchai ho",
                "Agar {topic} ko samajhna hai, toh use mehsoos bhi karna padega",
                "Zindagi ke kuch lessons {topic} ke through bhi mil jaate hain",
            ],
            "beat_templates": [
                "Pehla ehsaas ye hai ki har safar ka ek pace hota hai",
                "Dusra ehsaas, mohabbat ki tarah, {topic} mein bhi patience chahiye hota hai",
                "Teesra ehsaas yeh hai ki dil jab clarity paata hai toh fear kam hota hai",
                "Aur phir sach mein, meaning bhi zyada gehra lagne lagta hai",
            ],
            "bridge_templates": [
                "Thoda pause do, line ko mehsoos karne do",
                "Yahan awaz soft rakho, jaise kisi se baat nahi, ehsaas share kar rahe ho",
                "Is moment mein gravity zaruri hai",
                "Yeh part poetic hona chahiye, overdramatic nahi",
            ],
            "cta_templates": [
                "Agar dil se laga ho toh isse save kar lo",
                "Follow karo, kyunki aise safar aur bhi aayenge",
                "Jo baat yaad reh jaye, wahi kaam ki hoti hai",
            ],
            "outro_templates": [
                "Zindagi ka matlab kabhi kabhi ek line mein nahi aata",
                "Dil jo samajh le, wahi asal mein yaad rehta hai",
                "Safar chhota ho ya bada, ehsaas sachcha ho toh kaafi hai",
            ],
            "extra_templates": [
                "Aur haan, khamoshi bhi kabhi kabhi jawab hoti hai",
                "Har khwab ka ek waqt hota hai",
                "Kuch baatein bas mehsoos ki jaati hain",
            ],
            "system_prompt": dedent("""
                Do NOT sound like AI. You are writing how a charming poetic Hindi English storyteller actually speaks.
                Language: Hinglish. Tone: poetic, romantic, philosophical. Energy: medium. Pacing: slow.
                Use words like ishq, zindagi, dil, mohabbat, khwab, safar, yakeen naturally.
                Keep the script heartfelt, cinematic, and memorable.
            """).strip(),
        },
        "rebelkid": {
            "label": "Rebel Kid Style",
            "description": "Bold, unapologetic, feminine, sarcastic Gen Z Hinglish with strong opinions and playful edge.",
            "energy": "high",
            "pace": "fast",
            "signature_words": [
                "cute little red flag",
                "main character",
                "unfiltered",
                "delulu",
                "boundary",
                "chaos",
                "vibe check",
                "not my problem",
                "iconic",
                "unbothered",
            ],
            "hook_templates": [
                "Hey cute little red flag, {topic} pe thodi uncomfortable baat karte hain [pause]",
                "Listen, {topic} ko polite words mein bolna easy hai, but truth thoda sharper hota hai",
                "Not everything about {topic} deserves soft language, because the point is actually messy",
                "If {topic} makes people uncomfortable, good, maybe that means the conversation is finally honest",
            ],
            "intro_templates": [
                "Aaj {topic} ko thoda real way mein unpack karte hain, no fake sugar coating",
                "Sun na, {topic} ka scene simple nahi hai, but pretending it is simple is even worse",
                "Let's be honest, {topic} is not just a cute little issue, it's a pattern people keep ignoring",
            ],
            "beat_templates": [
                "Pehla point yeh hai ki log boundaries ko attitude bol dete hain, which is honestly lazy",
                "Dusra point yeh hai ki respect ko default samajhna chahiye, reward nahi",
                "Teesra point yeh hai ki loud hona aur wrong hona same cheez nahi hoti",
                "Aur fourth point yeh hai ki agar koi cheez baar baar drain kar rahi hai, toh normal nahi hai",
            ],
            "bridge_templates": [
                "Yahan thoda side eye energy chahiye, not overacting",
                "This line should feel direct, like you're calling out the nonsense without screaming",
                "Keep it sharp, slightly playful, and very clear",
                "Aur yahin pe script ka attitude actually lock hota hai",
            ],
            "cta_templates": [
                "Agar ye hit kiya toh save kar le, because this one deserves a rewatch",
                "Follow kar, kyunki aise conversations politely vanish nahi hone chahiye",
                "Send this to the friend who needs a reality check, lovingly of course",
            ],
            "outro_templates": [
                "Real baat bolna rude hona nahi hota",
                "Soft hona optional hai, clear hona zaruri hai",
                "Boundary rakhna drama nahi, self respect hai",
            ],
            "extra_templates": [
                "Polite tone ka matlab weak tone nahi hota",
                "No one gets points for being confusing",
                "Sometimes the honest line is the most useful one",
            ],
            "system_prompt": "Write like a bold, unapologetic Gen Z Indian woman who has opinions and is not afraid to say them clearly. Use Hinglish naturally. Keep it sharp, real, and slightly sarcastic without being mean.",
        },
    },
    "english": {
        "default": {
            "label": "Casual English",
            "description": "Natural conversational English.",
            "energy": "medium",
            "pace": "medium",
            "signature_words": ["honestly", "like", "literally", "you know", "right", "I mean", "lowkey", "no cap", "it's crazy how", "the thing is"],
            "hook_templates": [
                "Honestly, {topic} is one of those things that looks simple until you actually try it [pause]",
                "Like, {topic} sounds easy, but the real part hits differently",
                "You know what, {topic} is usually where people overthink way too much",
                "The thing is, {topic} only looks basic from the outside",
            ],
            "intro_templates": [
                "If you're looking at {topic} right now, the first thing to know is that clarity matters more than noise",
                "Honestly, once you understand {topic}, everything starts feeling a lot less random",
                "Here's the real part about {topic}: most people skip the simple stuff",
            ],
            "beat_templates": [
                "The first mistake is rushing the obvious part and calling it strategy",
                "The second mistake is making {topic} sound more complicated than it needs to be",
                "The third move is keeping the message simple enough to actually remember",
                "And that's usually where the whole thing starts working better",
            ],
            "bridge_templates": [
                "That part matters because it makes the script feel real",
                "This is where the delivery starts sounding human",
                "A small pause here makes the next line hit harder",
                "And that little shift changes the whole rhythm",
            ],
            "cta_templates": [
                "Save this if it helped, and follow for more",
                "Honestly, this is one of those things you'll want to come back to",
                "If this was useful, keep it for later",
            ],
            "outro_templates": [
                "And that's the part most people miss",
                "That really is the simplest version of it",
                "Once you see it clearly, it feels obvious",
            ],
            "extra_templates": [
                "It's crazy how simple it gets once the order is right",
                "A tiny change can make the whole thing feel better",
                "Honestly, that's the part worth remembering",
            ],
            "system_prompt": dedent("""
                Do NOT sound like AI. You are writing how a real person casually speaks in English.
                Use contractions always. Never use formal language. Tone: casual and conversational.
                Energy: medium. Pacing: medium.
                Use words like honestly, like, literally, you know, right, I mean, lowkey, no cap, it's crazy how, the thing is.
                Keep it natural, spoken, and human.
                Include [pause], [beat], and [HIGH ENERGY] markers only where useful.
            """).strip(),
        },
        "mrbeast": {
            "label": "MrBeast Inspired",
            "description": "High energy challenge style English.",
            "energy": "very high",
            "pace": "fast",
            "signature_words": ["we", "insane", "crazy", "I can't believe", "this is literally", "subscribe", "challenge", "you"],
            "hook_templates": [
                "[HIGH ENERGY] We just found the craziest way to explain {topic}, and I can't believe this actually works",
                "This {topic} idea is INSANE and I need you to see why right now",
                "We tried something wild with {topic} and the result was unbelievable",
                "I literally cannot believe how well this {topic} version works",
            ],
            "intro_templates": [
                "Okay, so here's what happened. We wanted to make {topic} way more exciting and way easier to understand",
                "The goal was simple. Take {topic}, make it huge, and make it impossible to ignore",
                "We had one job here, and that was to make {topic} feel like a real event",
            ],
            "beat_templates": [
                "First, we made the hook impossible to scroll past",
                "Then we built the payoff so strong that it actually felt earned",
                "After that, we pushed the energy even higher so nobody could drop off",
                "And that's exactly why this version works so well",
            ],
            "bridge_templates": [
                "[beat] This is where the momentum keeps climbing",
                "[HIGH ENERGY] You want the next line to feel bigger than the last",
                "This part should move fast and feel exciting",
                "And this is the payoff moment everyone stays for",
            ],
            "cta_templates": [
                "If this was insane, subscribe and keep watching",
                "Honestly, if you liked this, follow for more",
                "We need more ideas like this, so save it and come back later",
            ],
            "outro_templates": [
                "That was crazy, and I think we can take it even further",
                "This is the part that makes the whole thing unforgettable",
                "Now you can see why the structure matters so much",
            ],
            "extra_templates": [
                "The bigger the energy, the more people stay",
                "One strong line can change the whole video",
                "This is where the payoff really hits",
            ],
            "system_prompt": dedent("""
                Do NOT sound like AI. You are writing how a high energy challenge creator actually speaks.
                Use contractions always. Never use formal language. Tone: huge, dramatic, challenge driven.
                Energy: very high. Pacing: fast.
                Use words like insane, crazy, we, you, literally, subscribe, challenge.
                Structure the script with a hook, build up, payoff, and CTA.
                Include [HIGH ENERGY] and [beat] markers where they help timing.
            """).strip(),
        },
        "joerogan": {
            "label": "Joe Rogan Inspired",
            "description": "Curious, long form, exploratory English.",
            "energy": "medium",
            "pace": "slow",
            "signature_words": ["dude", "man", "bro", "it's entirely possible", "think about it", "that's wild", "I've been saying this"],
            "hook_templates": [
                "Dude, think about {topic} for a second [pause]",
                "It's entirely possible we've been looking at {topic} the wrong way",
                "Man, {topic} gets a lot more interesting when you slow it down",
                "Bro, {topic} is one of those things that opens up a bigger question",
            ],
            "intro_templates": [
                "The thing about {topic} is that it looks simple until you start asking the deeper questions",
                "Honestly, once you really sit with {topic}, you start noticing layers",
                "What makes {topic} interesting is not just the answer, but the way people think about it",
            ],
            "beat_templates": [
                "First, there's the obvious point, and then there's the part people usually miss",
                "Second, if you think about it long enough, the pattern starts showing up everywhere",
                "Third, once you step back, {topic} stops looking random",
                "And that's where the whole conversation gets a lot more interesting",
            ],
            "bridge_templates": [
                "[pause] let that sit for a second",
                "This is the kind of thing you keep circling back to",
                "That part deserves a little more time",
                "And honestly, that's the wild part",
            ],
            "cta_templates": [
                "If this got you thinking, stick around for more",
                "Honestly, save this and come back to it later",
                "Follow if you like conversations that actually go somewhere",
            ],
            "outro_templates": [
                "That's wild, and I think there's a lot more under the surface",
                "It really does make you look at the whole thing differently",
                "Once you see it, you can't really unsee it",
            ],
            "extra_templates": [
                "There's a deeper layer here for sure",
                "It's one of those ideas that keeps unfolding",
                "The more you think about it, the more it opens up",
            ],
            "system_prompt": dedent("""
                Do NOT sound like AI. You are writing how a curious podcast host actually speaks.
                Use contractions naturally. Tone: philosophical, curious, open minded. Energy: medium. Pacing: slow.
                Use words like dude, think about it, that's wild, I've been saying this, bro, man.
                Let the script breathe with [pause] and [beat]. Keep it conversational and exploratory.
            """).strip(),
        },
        "alexhormozi": {
            "label": "Alex Hormozi Inspired",
            "description": "Direct, business, value packed English.",
            "energy": "medium",
            "pace": "fast",
            "signature_words": ["here's the thing", "most people", "the mistake everyone makes", "let me break this down", "this is how you", "period"],
            "hook_templates": [
                "Here's the thing about {topic}: most people get the first step wrong",
                "The mistake everyone makes with {topic} is wasting time on the wrong part",
                "Let me break this down. {topic} is simpler than most people make it",
                "If you care about {topic}, this is the part that actually matters",
            ],
            "intro_templates": [
                "If you're serious about {topic}, you need a clean framework",
                "The issue with {topic} is not effort, it's structure",
                "Most people think {topic} is about more work. It's usually not",
            ],
            "beat_templates": [
                "Step one is understanding the constraint",
                "Step two is removing the friction that slows the outcome down",
                "Step three is repeating the part that compounds",
                "That is how you get better results without extra noise",
            ],
            "bridge_templates": [
                "[beat] That is the leverage point",
                "This part matters because it changes the whole outcome",
                "Now we're getting to the useful part",
                "This is where most people either win or quit",
            ],
            "cta_templates": [
                "Use this framework and stop guessing",
                "Save this, because this is how you get traction",
                "If this helps, follow for more breakdowns like this",
            ],
            "outro_templates": [
                "Period. That is the clean version of it",
                "That is the difference between busy and effective",
                "Once you see it, you can optimize it",
            ],
            "extra_templates": [
                "People overcomplicate the process and underuse the framework",
                "One clean system beats random effort every time",
                "Clarity wins because it removes wasted motion",
            ],
            "system_prompt": dedent("""
                Do NOT sound like AI. You are writing how a direct business creator actually speaks.
                Use contractions naturally. Tone: direct, business minded, value dense. Energy: medium. Pacing: fast.
                Use words like here's the thing, most people, the mistake everyone makes, let me break this down, period.
                Keep it sharp, practical, and framework driven.
                Include [beat] and [pause] when transitions matter.
            """).strip(),
        },
    },
}


# ── Data classes & errors ──────────────────────────────────────────────
@dataclass
class ScriptOutput:
    topic: str
    language: str
    personality: str
    platform: str
    duration_seconds: int
    script_text: str
    word_count: int
    generated_at: str

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


class AIScriptwriterError(Exception):
    """Base error for the local scriptwriter."""


class InvalidLanguageError(AIScriptwriterError):
    """Raised when an unsupported language is used."""


class InvalidPersonalityError(AIScriptwriterError):
    """Raised when an unsupported personality is used."""


class InvalidPlatformError(AIScriptwriterError):
    """Raised when an unsupported platform is used."""


class InvalidTopicError(AIScriptwriterError):
    """Raised when the topic is empty or invalid."""


class InvalidDurationError(AIScriptwriterError):
    """Raised when duration is invalid."""


class GenerationError(AIScriptwriterError):
    """Raised when script generation fails."""


# ── Main scriptwriter class ────────────────────────────────────────────
class AIScriptwriter:
    PERSONALITY_REGISTRY = PERSONALITY_REGISTRY

    def __init__(self, language: str = "english", personality: str = "default") -> None:
        self.language = _normalize_language(language)
        self.personality = _normalize_personality(personality)
        self._validate_personality(self.language, self.personality)

    def list_personalities(self, language: str) -> List[Dict[str, str]]:
        normalized_language = _normalize_language(language)
        return [
            {"key": key, "label": value["label"], "description": value["description"]}
            for key, value in self.PERSONALITY_REGISTRY[normalized_language].items()
        ]

    def set_personality(self, personality: str) -> None:
        normalized = _normalize_personality(personality)
        self._validate_personality(self.language, normalized)
        self.personality = normalized

    def set_language(self, language: str) -> None:
        self.language = _normalize_language(language)
        if self.personality not in self.PERSONALITY_REGISTRY[self.language]:
            self.personality = "default"

    def _validate_personality(self, language: str, personality: str) -> None:
        if language not in self.PERSONALITY_REGISTRY:
            raise InvalidLanguageError(f"Unsupported language: {language}")
        if personality not in self.PERSONALITY_REGISTRY[language]:
            available = ", ".join(self.PERSONALITY_REGISTRY[language].keys())
            raise InvalidPersonalityError(
                f"Unsupported personality: {personality}. Available for {language}: {available}"
            )

    def _profile(self) -> Dict[str, Any]:
        return self.PERSONALITY_REGISTRY[self.language][self.personality]

    def _estimate_word_count(self, duration_seconds: int) -> int:
        if duration_seconds <= 0:
            raise InvalidDurationError("duration_seconds must be greater than 0.")
        return max(20, round((duration_seconds / 60.0) * WORDS_PER_MINUTE))

    def _seeded_random(self, topic: str, duration_seconds: int, platform: str) -> random.Random:
        seed_text = f"{topic}|{duration_seconds}|{platform}|{self.language}|{self.personality}"
        seed_int = int(hashlib.sha256(seed_text.encode("utf-8")).hexdigest()[:16], 16)
        return random.Random(seed_int)

    def _pick_unique(self, items: List[str], rnd: random.Random, used: set) -> str:
        pool = [item for item in items if item not in used]
        if not pool:
            pool = items
        choice = rnd.choice(pool)
        used.add(choice)
        return choice

    def _voice_flavor(self, text: str, rnd: random.Random, profile: Dict[str, Any], probability: float = 0.55) -> str:
        if self.personality == "rebelkid":
            probability = min(probability, 0.25)
        words = profile.get("signature_words", [])
        if not words or rnd.random() > probability:
            return text
        sig = rnd.choice(words)
        if sig.lower() in text.lower():
            return text
        if text[:1].isupper():
            return f"{sig.capitalize()}, {text}"
        return f"{sig}, {text}"

    def _beat_count(self, platform: str, target_words: int) -> int:
        base = max(2, round(target_words / 40))
        bonus = {"youtube": 1, "linkedin": 1}.get(platform, 0)
        return max(2, min(5, base + bonus))

    def _format(self, template: str, **values: Any) -> str:
        try:
            return template.format(**values)
        except Exception as exc:
            raise GenerationError(f"Template formatting failed: {exc}") from exc

    def _build_hook(self, topic: str, platform: str, target_words: int, rnd: random.Random, profile: Dict[str, Any]) -> str:
        template = self._pick_unique(profile["hook_templates"], rnd, set())
        hook = self._format(template, topic=topic, platform=platform, word_count=target_words)
        return self._voice_flavor(hook, rnd, profile, probability=0.75)

    def _build_intro(self, topic: str, platform: str, rnd: random.Random, profile: Dict[str, Any]) -> str:
        template = self._pick_unique(profile["intro_templates"], rnd, set())
        intro = self._format(template, topic=topic, platform=platform)
        return self._voice_flavor(intro, rnd, profile, probability=0.65)

    def _build_body(self, topic: str, platform: str, beat_count: int, rnd: random.Random, profile: Dict[str, Any]) -> List[str]:
        beats: List[str] = []
        used_beats: set = set()
        used_bridges: set = set()
        for index in range(beat_count):
            beat_tpl   = self._pick_unique(profile["beat_templates"],   rnd, used_beats)
            bridge_tpl = self._pick_unique(profile["bridge_templates"],  rnd, used_bridges)
            beat_line   = self._format(beat_tpl,   topic=topic, platform=platform, beat=index + 1, total_beats=beat_count)
            bridge_line = self._format(bridge_tpl, topic=topic, platform=platform, beat=index + 1, total_beats=beat_count)
            if self.personality in {"carryminati", "mrbeast"} and index == 0:
                beat_line = f"[HIGH ENERGY] {beat_line}"
            elif self.personality in {"samayraina", "joerogan"}:
                beat_line = f"{beat_line} [pause]"
            combined = self._voice_flavor(f"{beat_line} {bridge_line}", rnd, profile, probability=0.5)
            beats.append(combined)
        return beats

    def _build_cta(self, topic: str, platform: str, rnd: random.Random, profile: Dict[str, Any]) -> str:
        template = self._pick_unique(profile["cta_templates"], rnd, set())
        return self._format(template, topic=topic, platform=platform)

    def _build_outro(self, topic: str, platform: str, rnd: random.Random, profile: Dict[str, Any]) -> str:
        template = self._pick_unique(profile["outro_templates"], rnd, set())
        line = self._format(template, topic=topic, platform=platform)
        if len(profile.get("extra_templates", [])) > 0 and rnd.random() > 0.5:
            extra_tpl = self._pick_unique(profile["extra_templates"], rnd, set())
            extra = self._format(extra_tpl, topic=topic, platform=platform)
            line = f"{line} {extra}"
        return line

    def _assemble_script(self, hook: str, intro: str, body: List[str], cta: str, outro: str) -> str:
        parts = [hook, intro] + body + [cta, outro]
        return "\n\n".join(p.strip() for p in parts if p.strip())

    def generate(
        self,
        topic: str,
        platform: str = "instagram",
        duration_seconds: int = 45,
    ) -> ScriptOutput:
        """
        Generate a platform-aware script for the given topic.

        Args:
            topic:            Subject of the script (e.g. "skincare routine").
            platform:         Target platform (instagram, youtube, tiktok, etc.).
            duration_seconds: Approximate script length in seconds.

        Returns:
            ScriptOutput dataclass with script_text and metadata.
        """
        topic = _clean_topic(topic)
        if not topic:
            raise InvalidTopicError("Topic cannot be empty.")

        platform = _normalize_platform(platform)
        profile = self._profile()
        rnd = self._seeded_random(topic, duration_seconds, platform)

        target_words = self._estimate_word_count(duration_seconds)
        beat_count   = self._beat_count(platform, target_words)

        hook  = self._build_hook(topic, platform, target_words, rnd, profile)
        intro = self._build_intro(topic, platform, rnd, profile)
        body  = self._build_body(topic, platform, beat_count, rnd, profile)
        cta   = self._build_cta(topic, platform, rnd, profile)
        outro = self._build_outro(topic, platform, rnd, profile)

        script_text = self._assemble_script(hook, intro, body, cta, outro)
        word_count  = _count_words(script_text)

        return ScriptOutput(
            topic=topic,
            language=self.language,
            personality=self.personality,
            platform=platform,
            duration_seconds=duration_seconds,
            script_text=script_text,
            word_count=word_count,
            generated_at=datetime.now(timezone.utc).isoformat(),
        )

    def _get_personality_rules(self) -> Dict[str, Any]:
        """
        Real personality brain — not just words, but HOW they think and speak.
        """
        return {
            "carryminati": {
                "style": "roast",
                "energy_pattern": ["build", "sarcasm", "attack", "burst"],
                "sentence_style": "chaotic",
                "interruptions": True,
                "abuse_level": "medium_censored",
                "direct_attack": True,
                "logic_flow": "non_linear",
                "signature": [
                    "bhai kya kar raha hai tu",
                    "samajh raha hai na tu",
                    "ye kya bakchodi hai",
                    "bkl",
                    "bc",
                ],
                "cta_style": "commanding",
            },
            "samayraina": {
                "style": "dark_comedy",
                "energy_pattern": ["slow", "pause", "realization", "punchline"],
                "sentence_style": "broken",
                "interruptions": False,
                "abuse_level": "light",
                "direct_attack": False,
                "logic_flow": "self_reflective",
                "signature": [
                    "matlab",
                    "haan toh",
                    "soch raha tha",
                    "ye bhi theek hai",
                    "bkl",
                ],
                "cta_style": "awkward",
            },
            "dhruvrathee": {
                "style": "educational",
                "energy_pattern": ["problem", "data", "explanation", "conclusion"],
                "sentence_style": "structured",
                "interruptions": False,
                "abuse_level": "none",
                "direct_attack": False,
                "logic_flow": "linear",
                "signature": [
                    "research kehti hai",
                    "ye numbers dekhiye",
                    "log nahi jaante",
                    "fact ye hai",
                    "namaskar dosto",
                ],
                "cta_style": "informational",
            },
            "rebelkid": {
                "style": "bold_feminine",
                "energy_pattern": ["statement", "challenge", "truth", "attitude"],
                "sentence_style": "sharp",
                "interruptions": True,
                "abuse_level": "medium",
                "direct_attack": False,
                "logic_flow": "emotional_real",
                "signature": [
                    "cute little red flag",
                    "not my problem",
                    "boundary hai",
                    "respect chahiye",
                    "stop normalizing this",
                ],
                "cta_style": "attitude",
            },
        }

    def _generate_hook(self, topic: str, rules: Dict[str, Any]) -> str:
        """Personality-specific hook line."""
        p = self.personality
        if p == "carryminati":
            return f"Bhai {topic} dekh ke lag raha hai duniya ka system hi crash ho gaya hai. Samajh raha hai na tu?"
        if p == "samayraina":
            return f"Toh haan... {topic}. [pause] Matlab mujhe pehle hi samajh jana chahiye tha... but nahi samjha."
        if p == "dhruvrathee":
            return f"Aaj hum baat karenge {topic} ke baare mein. Aur jo sach hai, wo kaafi log nahi jaante."
        if p == "rebelkid":
            return f"Hey cute little red flag, {topic} ko log itna lightly lete hain na, it's actually embarrassing."
        if p == "shahrukhkhan":
            return f"Zindagi mein {topic} bhi ek safar ki tarah hota hai... aur har safar dil se guzarta hai."
        if p == "mrbeast":
            return f"[HIGH ENERGY] We just figured out the INSANE truth about {topic} and I literally cannot believe it works."
        if p == "joerogan":
            return f"Dude, think about {topic} for a second. [pause] Like really think about it."
        if p == "alexhormozi":
            return f"Here's the thing about {topic}: most people get the first step completely wrong. Period."
        # hinglish default / english default
        if self.language == "hinglish":
            return f"Yaar, {topic} ka scene simple nahi hai, but literally yahin pe game change hota hai. [pause]"
        return f"Honestly, {topic} is something people completely misunderstand."

    def _generate_body_segment(self, topic: str, rules: Dict[str, Any], index: int) -> str:
        """Personality-specific body beat."""
        p = self.personality
        beats = {
            "carryminati": [
                f"Ye jo {topic} hai na, isme sab log expert ban rahe hain. Reality kya hai pata hai? Koi kuch nahi jaanta, bas bakchodi chal rahi hai.",
                f"Aur phir log poochte hain ki results kyun nahi aa rahe. [HIGH ENERGY] Bhai structure nahi hai, direction nahi hai, bas energy waste ho rahi hai.",
                f"Seedha bolta hoon: {topic} mein shortcut dhundhne waale hamesha fail hote hain. Ye truth hai, bura lage toh bhi.",
            ],
            "samayraina": [
                f"Matlab {topic} mein problem kya hai? Problem ye hai ki sabko lagta hai wo right hai. Aur main bhi wahi kar raha tha. [pause] classic.",
                f"Phir obviously jo hona tha wahi hua. [pause] Matlab predictable tha, but hum log toh optimistic the na.",
                f"Aur ye realization late aata hai. Hamesha. Ye bhi theek hai. [pause] At least aaya toh.",
            ],
            "dhruvrathee": [
                f"Iska pehla reason hai awareness ki kami. Data clearly show karta hai ki log isko samajhte hi nahi properly.",
                f"Dusra reason hai ki hum surface level information pe rely karte hain. Research kehti hai ki deeper understanding zaroori hai.",
                f"Teesra aur sabse important reason: log {topic} ko emotional lens se dekhte hain, evidence se nahi.",
            ],
            "rebelkid": [
                f"Log {topic} ko ignore karte hain, phir jab consequences aate hain tab shock ho jaate hain. Like seriously?",
                f"Aur phir wahi log bolte hain ki yeh toh normal hai. No it's not. Normalize mat karo ye sab.",
                f"Boundary rakhna attitude nahi hai. {topic} mein jo bhi clearly nahi bolta, woh hi zyada suffer karta hai.",
            ],
            "shahrukhkhan": [
                f"Pehla ehsaas ye hai ki {topic} mein patience chahiye. Har safar apne pace pe chalta hai.",
                f"Dusra ehsaas, mohabbat ki tarah, {topic} mein bhi consistency chahiye hoti hai.",
                f"Aur teesra, jo dil samajh le wahi yaad rehta hai. {topic} ka sach bhi waise hi milta hai.",
            ],
            "mrbeast": [
                f"First, we made {topic} impossible to ignore. The hook was crazy strong.",
                f"Then we pushed harder. The payoff was so big people literally couldn't scroll past.",
                f"And that's exactly why this {topic} version works better than anything else out there.",
            ],
            "joerogan": [
                f"The thing about {topic} is people don't really sit with it long enough. Once you do, layers start showing up.",
                f"And if you think about it, the pattern keeps repeating. It's wild how consistent it is.",
                f"Once you step back from {topic}, it stops looking random. It's actually all connected.",
            ],
            "alexhormozi": [
                f"Step one: understand the constraint inside {topic}. Most people skip this.",
                f"Step two: remove the friction. The thing slowing your {topic} results is usually obvious if you look.",
                f"Step three: repeat the part that compounds. One clean system beats random effort every time.",
            ],
        }
        default_beats = [
            f"The first thing about {topic} is people rush past the obvious part.",
            f"The second thing is most people overcomplicate what {topic} actually requires.",
            f"And that's usually where everything starts working once you simplify it.",
        ]
        personality_beats = beats.get(p, default_beats)
        return personality_beats[index % len(personality_beats)]

    def _generate_cta(self, rules: Dict[str, Any]) -> str:
        """Personality-specific call to action."""
        p = self.personality
        if p == "carryminati":
            return "Abey samajh gaya toh like kar aur subscribe ho ja, warna phir se dekh."
        if p == "samayraina":
            return "Theek hai dosto... agar thoda useful laga toh follow kar lo. [pause] warna bhi theek hai."
        if p == "dhruvrathee":
            return "Agar aapko ye informative laga, toh isse share zarur karein aur follow karein."
        if p == "rebelkid":
            return "If this triggered you, good. Save it. And stop apologizing for existing."
        if p == "shahrukhkhan":
            return "Agar dil se laga ho toh isse save kar lo. Aise safar aur bhi aayenge."
        if p == "mrbeast":
            return "If this was insane, subscribe and keep watching. We're just getting started."
        if p == "joerogan":
            return "If this got you thinking, stick around. There's a lot more under the surface."
        if p == "alexhormozi":
            return "Save this framework and stop guessing. Use it. Period."
        if self.language == "hinglish":
            return "Isko save kar le bro, baad mein kaam aayega. Aur follow kar agar useful laga."
        return "Follow for more, and save this for later."

    def _get_hook_and_cta(self, topic: str) -> Dict[str, str]:
        """Returns personality-specific hook and CTA strings."""
        p = self.personality
        if p == "carryminati":
            return {
                "hook": f"Bhai kya kar raha hai tu\u2026 {topic} dekh ke dimaag hil gaya mera.",
                "cta":  "Abey samajh gaya toh subscribe kar\u2026 warna wapas aa ke mat bolna samjhaya nahi.",
            }
        if p == "samayraina":
            return {
                "hook": f"Toh haan\u2026 {topic}\u2026 [pause] mujhe lagta hai ye hona hi tha.",
                "cta":  "Like kar do\u2026 nahi kiya toh bhi theek hai\u2026 waise bhi aadat hai ignore hone ki.",
            }
        if p == "dhruvrathee":
            return {
                "hook": f"Namaskar dosto. Aaj hum baat karenge {topic} ke baare mein\u2026 aur sach kya hai.",
                "cta":  "Agar aapko aisi factual videos pasand hain, toh channel ko subscribe karein.",
            }
        if p == "shahrukhkhan":
            return {
                "hook": f"Zindagi mein kuch baatein hoti hain\u2026 aur {topic} unmein se ek hai.",
                "cta":  "Agar dil ko chhu gaya ho\u2026 toh subscribe karna mat bhoolna.",
            }
        if p == "rebelkid":
            return {
                "hook": f"Hey cute little red flag\u2026 {topic} pe baat karni hai because honestly this is getting annoying.",
                "cta":  "Follow kar le\u2026 warna next time bhi trigger ho jayega aur phir roega.",
            }
        if p == "mrbeast":
            return {
                "hook": f"We just tested something insane about {topic}\u2026 and I can't believe what happened.",
                "cta":  "Subscribe right now or you'll miss the next crazy experiment.",
            }
        if p == "joerogan":
            return {
                "hook": f"Dude\u2026 think about {topic} for a second\u2026 like really think about it.",
                "cta":  "If you enjoy these conversations, make sure you follow.",
            }
        if p == "alexhormozi":
            return {
                "hook": f"Here's the truth about {topic} that nobody tells you.",
                "cta":  "If this helped you, subscribe. If not, you probably weren't paying attention.",
            }
        # default (hinglish or english)
        if self.language == "hinglish":
            return {
                "hook": f"Yaar, {topic} pe aaj seedha baat karte hain.",
                "cta":  "Isko save kar le bro, baad mein kaam aayega.",
            }
        return {
            "hook": f"Honestly\u2026 {topic} is something people don't talk about enough.",
            "cta":  "Follow for more real content like this.",
        }

    def _build_script(self, topic: str, word_count: int) -> str:
        """
        Rich personality-driven script builder.
        Uses _get_hook_and_cta + per-personality body copy.
        """
        hc = self._get_hook_and_cta(topic)
        p  = self.personality

        if p == "carryminati":
            body = (
                f"Bhai {topic} dekh ke lagta hai log dimaag ghar pe chhod ke aaye hain.\n\n"
                "[HIGH ENERGY] kya kar raha hai tu bhai? Ye kya bakchodi hai?\n\n"
                "Sabko shortcut chahiye. Mehnat nahi karni. Bas trend follow karo aur khush ho jao.\n\n"
                "Reality check chahiye? Kuch nahi hone wala aise.\n\n"
                "Aur fir bolte hain life unfair hai\u2026 bhai unfair nahi hai\u2026 tu hi dumb hai thoda."
            )
        elif p == "samayraina":
            body = (
                f"Toh haan\u2026 {topic}\u2026 [pause]\n\n"
                "Mujhe lagta hai ye hona hi tha.\n\n"
                "Sab log kar rahe hain\u2026 toh maine bhi try kiya\u2026 [pause]\n\n"
                "Result? Same as my life\u2026 thoda disappointment\u2026 thoda regret.\n\n"
                "Aur funny part kya hai? Sabko pata hai ye bekaar hai\u2026 phir bhi karte hain.\n\n"
                "Kyun? Kyunki hum sab thode stupid hain\u2026 aur thoda lonely bhi."
            )
        elif p == "dhruvrathee":
            body = (
                f"Sabse pehle samajhte hain ki {topic} actually problem kyun hai.\n\n"
                "Research kehti hai ki log bina soche samjhe trends follow karte hain, "
                "jisse long term growth impact hoti hai.\n\n"
                "Example dekhiye\u2026 jab log sirf viral content copy karte hain, toh originality khatam ho jaati hai.\n\n"
                "Aur sach ye hai\u2026 ki ye system aapko intentionally lazy bana raha hai.\n\n"
                "Conclusion simple hai\u2026 agar aap alag nahi sochoge, toh kabhi grow nahi karoge."
            )
        elif p == "shahrukhkhan":
            body = (
                f"Kabhi kabhi lagta hai\u2026 {topic} sirf ek trend nahi\u2026 ek ehsaas hai.\n\n"
                "Log bas bheed ka hissa ban jaate hain\u2026 bina soche\u2026 bina samjhe.\n\n"
                "Lekin asli baat kya hai? Dil se jo aata hai\u2026 wahi tikta hai.\n\n"
                "Zindagi mein asli jeet wahi hai\u2026 jab aap khud ban pao."
            )
        elif p == "rebelkid":
            body = (
                f"Okay listen\u2026 {topic} is literally getting on my nerves.\n\n"
                "Like bro\u2026 how are people still this dumb?\n\n"
                "Sabko validation chahiye\u2026 aur dignity zero.\n\n"
                "And don't even get me started on fake influencers\u2026\n\n"
                "Confidence ka naam leke stupidity promote kar rahe ho.\n\n"
                "At this point\u2026 it's not funny anymore\u2026 it's embarrassing."
            )
        elif p == "mrbeast":
            body = (
                f"So here's what we did.\n\n"
                f"We tested {topic}\u2026 and the results were insane.\n\n"
                "People who followed trends blindly failed almost every time.\n\n"
                "But the ones who thought differently actually won.\n\n"
                "This proves that originality beats copying every single time."
            )
        elif p == "joerogan":
            body = (
                f"It's entirely possible that {topic} is actually changing how people think.\n\n"
                "Like\u2026 think about it.\n\n"
                "We're rewarding behavior that doesn't require effort.\n\n"
                "And that's kinda dangerous if you zoom out."
            )
        elif p == "alexhormozi":
            body = (
                f"Here's the mistake people make with {topic}.\n\n"
                "They follow trends instead of building value.\n\n"
                "Step 1: Stop copying.\n"
                "Step 2: Build skill.\n"
                "Step 3: Stay consistent.\n\n"
                "That's it. That's the game."
            )
        else:
            # hinglish default / english default
            if self.language == "hinglish":
                body = (
                    f"Yaar, {topic} pe log seriously zyada overthink karte hain.\n\n"
                    "Simple cheez ko complicated banana band karo.\n\n"
                    "Ek step lo, ek result dekho, phir next step."
                )
            else:
                body = (
                    f"Honestly\u2026 {topic} is more important than people think.\n\n"
                    "Most people ignore it\u2026 and that's why they struggle.\n\n"
                    "If you understand this early\u2026 you're already ahead."
                )

        return f"{hc['hook']}\n\n{body}\n\n{hc['cta']}"

    def generate_script_output(
        self,
        topic: str,
        duration_seconds: int = 60,
        platform: str = "instagram",
    ) -> "ScriptOutput":
        """
        Alias matching GPT's naming convention.
        Identical to generate_script() — both are valid entry points.
        """
        topic = _clean_topic(topic)
        if not topic:
            raise InvalidTopicError("Topic cannot be empty.")

        word_count  = max(20, int((duration_seconds / 60) * WORDS_PER_MINUTE))
        script_text = self._build_script(topic, word_count).strip()

        if self.personality == "carryminati":
            script_text = self._add_carry_chaos(script_text)

        return ScriptOutput(
            topic=topic,
            language=self.language,
            personality=self.personality,
            platform=_normalize_platform(platform),
            duration_seconds=duration_seconds,
            script_text=script_text,
            word_count=_count_words(script_text),
            generated_at=datetime.now(timezone.utc).isoformat(),
        )

    def _build_real_script(self, topic: str, rules: Dict[str, Any], word_target: int) -> str:
        """Assembles a full personality-driven script from dynamic parts."""
        parts: List[str] = []
        parts.append(self._generate_hook(topic, rules))
        for i in range(3):
            parts.append(self._generate_body_segment(topic, rules, i))
        parts.append(self._generate_cta(rules))
        return "\n\n".join(p.strip() for p in parts if p.strip())

    def _add_carry_chaos(self, text: str) -> str:
        """
        Randomly sprinkles CarryMinati-style chaos lines into the script.
        Applied only when personality is carryminati.
        """
        chaos_lines = [
            "bhai tu kya kar raha hai seriously?",
            "dimaag ghar pe chhod ke aaya hai kya?",
            "ye kya bakchodi chal rahi hai?",
            "samajh nahi aa raha kya?",
            "itna bhi kya desperate hai bhai?",
        ]
        parts = text.split("\n")
        for i in range(len(parts)):
            if random.random() < 0.3:
                parts[i] = parts[i] + " " + random.choice(chaos_lines)
        return "\n".join(parts)

    def generate_script(
        self,
        topic: str,
        duration_seconds: int = 60,
        platform: str = "instagram",
    ) -> "ScriptOutput":
        """
        Upgraded script generation using real personality brain.
        Powers the FastAPI /generate-script endpoint.
        """
        topic = _clean_topic(topic)
        if not topic:
            raise InvalidTopicError("Topic cannot be empty.")

        rules       = self._get_personality_rules().get(self.personality, {})
        word_target = max(20, int((duration_seconds / 60) * WORDS_PER_MINUTE))
        # Use rich _build_script if available, fall back to _build_real_script
        script_text = self._build_script(topic, word_target)

        if self.personality == "carryminati":
            script_text = self._add_carry_chaos(script_text)

        return ScriptOutput(
            topic=topic,
            language=self.language,
            personality=self.personality,
            platform=_normalize_platform(platform),
            duration_seconds=duration_seconds,
            script_text=script_text,
            word_count=_count_words(script_text),
            generated_at=datetime.now(timezone.utc).isoformat(),
        )

    def generate_dict(
        self,
        topic: str,
        platform: str = "instagram",
        duration_seconds: int = 45,
    ) -> Dict[str, Any]:
        """Same as generate() but returns a plain dict instead of ScriptOutput."""
        return self.generate(topic=topic, platform=platform, duration_seconds=duration_seconds).to_dict()


# ── Convenient factory function ────────────────────────────────────────
def make_scriptwriter(language: str = "english", personality: str = "default") -> AIScriptwriter:
    """Create and return an AIScriptwriter instance."""
    return AIScriptwriter(language=language, personality=personality)