---

## 🗂️ 1. Data Source

- **File**: `reviews_with_vader_sentiment.csv`  
- **Rows**: 300 000  
- **Fields**: 42 (ratings, text, timestamps, VADER compound, splits…)

All fields are loaded natively into Tableau Desktop. We build the following calculated fields and transformations in–workbook.

---

## ⚙️ 2. Data Pre-processing & Calculated Fields

| Field Name                    | Type             | Definition / Formula                                                                                                                                          | Purpose                                                                                               |
|-------------------------------|------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------|
| **Date**                      | Date             | `DATE(DATETRUNC('day', DATETIME([Timestamp]/1000)))`                                                                                                          | Convert Unix-ms timestamp into a continuous Date for time-series, filters, reference bands, etc.      |
| **Sentiment Category**        | String           | `IF [Rating]>=4 THEN "Positive"\nELSEIF [Rating]=3 THEN "Neutral"\nELSE "Negative" END`                                                                          | Bucket 1–5 star ratings into Negative/Neutral/Positive.                                                |
| **Avg Rating**                | Number (float)   | `AVG([Rating])`                                                                                                                                               | Overall average rating (used as building block for product‐level fixed LOD calculations).             |
| **asin count**                | Number (integer) | `COUNT([asin])`                                                                                                                                               | Review volume per product (ASIN).                                                                      |
| **Review Count**              | Number (integer) | *alias of* `asin count`                                                                                                                                        | Semantic clarity when filtering or labeling “number of reviews.”                                       |
| **Avg Rating per ASIN**       | Number (float)   | `{ FIXED [asin] : AVG([Rating]) }`                                                                                                                            | Product‐level average rating, regardless of any other slicing.                                         |
| **TextLength**                | Number (integer) | `LEN([Text])`                                                                                                                                                 | Character length of each review—used to detect ultra-short (“spammy”) reviews.                         |
| **SentimentAbs**              | Number (float)   | `ABS([Vader Compound])`                                                                                                                                       | Magnitude of sentiment polarity (0–1) for outlier detection.                                          |
| **word_occurrence**           | String           | `LOWER(REGEXP_EXTRACT([Text], '^(\\w+)'))`  *(or the first token from your split fields)*                                                                      | Individual token for Word Cloud and keyword‐based filters.                                             |
| **count_of_words_occurrence** | Number (integer) | `COUNT([word_occurrence])` *(or `LEN(SPLIT([Text],' '))` for word-count)*                                                                                       | Frequency of each token—drives the Word Cloud and keyword filter.                                      |
| **OutlierFlag**               | String           | `IF [TextLength] < PERCENTILE([TextLength], .05) OR [SentimentAbs] > 0.8 THEN "Outlier" ELSE "Normal" END` *(example thresholds)*                                 | Flags “weird” reviews (too short or extremely polarized) for Fraud Detection & Anomalies dashboard.  |

> **Tips**  
> - Adjust the `PERCENTILE` and polarity thresholds in **OutlierFlag** to tune sensitivity.  
> - You can split on spaces instead of regex to extract tokens for the Word Cloud.

---

## 📊 3. Dashboard Breakdown & Navigation

1. **Sentiment Heatmap**  
   - **What**: Average VADER polarity by star rating × sentiment bucket.  
   - **Filters**: Category, Rating, Date, Verified Purchase.  
   - **Insight**: How text‐based sentiment aligns (or misaligns) with explicit star ratings.

2. **Review Trends Over Time**  
   - **What**: Monthly review volume trend line + trend‐line.  
   - **Filters**: Category, Rating, Date slider.  
   - **Insight**: Seasonal or pandemic-related shifts in review activity.

3. **Product Comparison Dashboard**  
   - **What**: → Top/Bottom 10 products by review count vs. average rating.  
   - **What**: → Scatter of review volume vs. Avg Rating for all products.  
   - **Filters**: Category, Review Count slider, Rating.  
   - **Insight**: Which ASINs punch above (or below) their weight in customer feedback.

4. **Purchase Behavior Patterns**  
   - **What**: Heatmap of Verified Purchase × Sentiment by Rating + scatter of Verified vs. Avg Rating.  
   - **Insight**: Do verified buyers leave systematically different feedback?

5. **Review Volume Anomalies**  
   - **What**: Daily (or weekly) reviews line chart + reference bands at Avg ± 2 StdDev.  
   - **Insight**: Detect spikes/dips—possible campaign boosts or data glitches.

6. **Reviewer-Level Outliers**  
   - **What**: Box plot of reviews per user, clustered by typical reviewer groups.  
   - **Insight**: Spot power-reviewers or potential bots (e.g. single user posting hundreds overnight).

7. **Length vs. Sentiment**  
   - **What**: Scatter of review length vs. sentiment magnitude, with distribution bands at ±2 StdDev.  
   - **Insight**: Identify spammy, extremely short + highly polarized reviews (“red flags”).

8. **Fraud Detection & Anomalies**  
   - **What**: Combines outlier flags, volume anomalies, reviewer outliers to highlight suspicious patterns.  
   - **Filters**: All dashboards feed into this unified fraud-detection canvas.

---

## 🔑 4. Key Business Questions Addressed

1. **Which product categories drive the most engagement?**  
2. **How closely does review text sentiment align with star ratings?**  
3. **Are there seasonal or pandemic-driven spikes in review volume?**  
4. **Which products maintain the best balance of high ratings and high volumes?**  
5. **Do verified purchases yield measurably different ratings or sentiments?**  
6. **Can we proactively flag potential fake/spam reviews by outlier detection?**

---

## 🚀 5. Getting Started

1. Install Tableau Desktop (v2022.1 or later).  
2. Open each workbook under `dashboards/` or use the packaged `.twbx`.  
3. Point the data source to `reviews_with_vader_sentiment.csv`.  
4. Verify calculated fields under **Data → [your data source] → Create Calculated Field…**.  
5. Enjoy interactive filtering, hover-tooltips, and action links across dashboards!

---

## 📈 6. Insights Summary

> **Sentiment vs. Stars**  
> - Neutral reviews skew more negative in text.  
>  
> **Time Trends**  
> - A steep trough in April 2020 (lockdowns), then gradual recovery.  
>  
> **Product Leaders**  
> - A handful of electronics ASINs garner both high volume (> 500 reviews) & > 4.5 Avg Rating.  
>  
> **Verified Purchase Effects**  
> - Verified buyers average ~4.1 stars vs. ~4.0 for unverified—not huge but consistent.  
>  
> **Anomaly Detection**  
> - Multiple daily‐volume spikes exceed +2 StdDev—likely promotional or data issues.  
>  
> **Reviewer Outliers & Spam**  
> - ~5% of reviewers post > 25 reviews in a week; ultra-short (< 20 chars) & extreme sentiment often map to “OutlierFlag.”

---
