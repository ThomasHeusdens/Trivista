# Trivista

A triathlon training app designed for athletic progression, combining nutrition, workouts, stretching, and recovery plans into one seamless user experience. Built with **React Native**, **Firebase**, and **Expo Router**, Trivista is made for beginners and keeps users motivated across 12-week training plan.

---

## License

This project is **licensed**, but not open-source. All rights are reserved by **Thomas Heusdens**.

> No part of this software, its design, code, or logic may be copied, modified, redistributed, or republished without explicit written consent from the author.

Refer to the [LICENSE](LICENSE.md) file for the full license.

---

## Why I'm Doing This Project

This app is the result of an academic thesis to:

- Solve real-world needs for triathlon preparation.
- Learn and apply scalable mobile development with secure cloud data storage.
- Improve onboarding flows, personalized AI-driven suggestions, and user metrics.

---

## Why It’s Useful

Trivista solves common problems triathletes face:

- Estimating calories and macros based on body composition goals.
- Structuring training, recovery, and mobility in one clear schedule.
- Supporting beginners with guided content.
- Saving time not having to search for basic information about training, stretching, nutrition or recovery.

---

## Project Structure Overview

```
app/
├── (app)/                        # Main authenticated routes group
│   ├── (tabs)/                   # Bottom tab navigation for main features
│   │   ├── eat.tsx              # Nutrition dashboard (macros, calories)
│   │   ├── stretch.tsx          # Stretching routines and flexibility tips
│   │   ├── train.tsx            # Training plans, sessions, and activities
│   │   ├── recover.tsx          # Recovery tips and post-training advice
│   │   └── _layout.tsx          # Custom layout for top & bottom nav (main tabs)
│   │
│   ├── (profile-tabs)/          # Separate tab system for profile section
│   │   ├── sessions.tsx         # User session history or planning
│   │   ├── faq.tsx              # Frequently Asked Questions
│   │   ├── progress.tsx         # Progress tracking and analytics
│   │   └── _layout.tsx          # Custom nav for profile section (cross icon, etc.)
│   │
│   ├── index.tsx                # Redirects to main tabs
│
├── onboarding/                  # Multi-step onboarding flow for new users
│   ├── index.tsx                # First onboarding screen (start of flow)
│   ├── page2.tsx                # User data input (age, height, weight, etc.)
│   ├── page3.tsx                # Training start date selection
│   ├── page4.tsx                # Final setup or intro screen
│   └── _layout.tsx              # Onboarding flow wrapper
│
├── sign-in.tsx                  # Sign-in screen for returning users
├── sign-up.tsx                  # Sign-up screen for new users
└── _layout.tsx                  # Root layout: provides auth context + fonts
```

---

## References & Research

- **Login System**: [https://www.youtube.com/watch?si=R_FhSdTMjMsJUViW&v=Yva2Ep717v0&feature=youtu.be](https://www.youtube.com/watch?si=R_FhSdTMjMsJUViW&v=Yva2Ep717v0&feature=youtu.be)
- **Expo rendering Bug Fix**: [https://stackoverflow.com/q/79602687](https://stackoverflow.com/q/79602687)
- **Macro Ratio Guide**: [https://www.trainingpeaks.com/blog/is-your-food-fueling-you-the-macronutrient-balance](https://www.trainingpeaks.com/blog/is-your-food-fueling-you-the-macronutrient-balance)
- **Calories & RMR**: [https://www.verywellhealth.com/how-many-calories-do-i-need-8417837](https://www.verywellhealth.com/how-many-calories-do-i-need-8417837)

---

## Author

- **Thomas Heusdens** — _Developer, Designer, Architect_
  📧 [thomas.heusdens@student.ehb.be](mailto:thomas.heusdens@student.ehb.be)
  🐙 [GitHub](https://github.com/ThomasHeusdens)

---

## Contributing

Contributions are **not** open. This is a private academic project with restricted licensing.
