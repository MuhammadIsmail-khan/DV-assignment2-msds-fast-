

---

## 1. Data Source

- **File**: `reviews_with_vader_sentiment.csv`  
- **Rows**: 300 000  
- **Columns**: 42 (rating, text, timestamp, VADER compound, token splits, etc.)

All fields load natively into Tableau Desktop. We then create calculated fields and transformations directly in the workbook.

---
## 2. Data Pre-processing & Calculated Fields

Before loading into Tableau, we performed the following preprocessing steps in sequence:

1. **Convert JSON to CSV**  
   - Flattened and combined the raw Amazon review JSON files into a single `Output.csv`.
2. **Field additions & transformations**  
   - Parsed `Timestamp` (ms) into a continuous `Date` field.  
   - Extracted `word_occurrence` tokens, computed `TextLength`, etc.
3. **Sentiment prediction with VADER**  
   - Computed `vader_compound` polarity scores on review text.  
   - Bucketed into `Sentiment_Category_VADER` (Positive/Neutral/Negative).
4. **Load into Tableau**  
   - Defined the following calculated fields:

| Field Name                    | Type           | Definition / Formula                                                                                                    | Purpose                                                                                               |
|-------------------------------|----------------|--------------------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------|
| **Date**                      | Date           | `DATE(DATETRUNC('day', DATETIME([Timestamp]/1000)))`                                                                    | Convert Unix-ms timestamp to continuous Date for time series and filters.                             |
| **Sentiment Category**        | String         | `IF [Rating]>=4 THEN "Positive" ELSEIF [Rating]=3 THEN "Neutral" ELSE "Negative" END`                                    | Bucket star ratings into Negative/Neutral/Positive.                                                   |
| **Avg Rating**                | Float          | `AVG([Rating])`                                                                                                         | Overall average rating (used in product-comparison and summary views).                                |
| **asin count**                | Integer        | `COUNT([asin])`                                                                                                         | Review volume per product (ASIN).                                                                     |
| **Review Count**              | Integer        | *Alias of* `asin count`                                                                                                 | Semantic clarity when filtering or labeling “number of reviews.”                                      |
| **Avg Rating per ASIN**       | Float          | `{ FIXED [asin] : AVG([Rating]) }`                                                                                       | Product-level average rating, unaffected by other filters.                                            |
| **TextLength**                | Integer        | `LEN([Text])`                                                                                                           | Character length of each review—used to detect ultra-short (“spammy”) reviews.                        |
| **SentimentAbs**              | Float          | `ABS([Vader Compound])`                                                                                                 | Magnitude of sentiment polarity (0–1) for outlier detection.                                          |
| **word_occurrence**           | String         | `LOWER(REGEXP_EXTRACT([Text], '^(\\w+)'))` *(or split token)*                                                            | Individual token for Word Cloud and keyword-based filters.                                            |
| **count_of_words_occurrence** | Integer        | `COUNT([word_occurrence])` *(or `LEN(SPLIT([Text],' '))`)*                                                               | Frequency of each token—drives the Word Cloud and keyword filter.                                     |
| **OutlierFlag**               | String         | `IF [TextLength] < PERCENTILE([TextLength],0.05) OR [SentimentAbs]>0.8 THEN "Outlier" ELSE "Normal" END`                  | Flags “weird” reviews (too short or highly polarized) for Fraud Detection & Anomalies dashboard.      |

> **Tip:** Adjust percentile or polarity thresholds in **OutlierFlag** to tune sensitivity.
---

## 3. Dashboard Breakdown & Navigation

1. **Sentiment Heatmap**  
   - **View:** Heatmap of average VADER polarity by star rating × sentiment bucket  
   - **Filters:** Category, Rating, Date, Verified Purchase  
   - **Insight:** Reveals how text-based sentiment aligns (or misaligns) with explicit star ratings.

2. **Review Trends Over Time**  
   - **View:** Monthly review-volume trend line + trend-line  
   - **Filters:** Category, Rating, Date slider  
   - **Insight:** Highlights seasonal or pandemic-related shifts (e.g., April 2020 trough).

3. **Product Comparison Dashboard**  
   - **View:**  
     - Bar chart of Top 10 vs Bottom 10 products by review count & avg rating  
     - Scatter plot of review volume vs Avg Rating for all products  
   - **Filters:** Category, Review Count slider, Rating  
   - **Insight:** Identifies blockbuster ASINs and “hidden gems.”

4. **Purchase Behavior Patterns**  
   - **View:**  
     - Heatmap of Verified Purchase × sentiment by Rating  
     - Bubble plot of Verified vs Avg Rating  
   - **Insight:** Shows that verified buyers rate ~0.1 star higher on average.

5. **Review Volume Anomalies**  
   - **View:** Daily/weekly review counts with reference band at Avg ± 2 StdDev  
   - **Insight:** Detects spikes/dips (promotional boosts, data glitches).

6. **Reviewer-Level Outliers**  
   - **View:** Box plot of reviews per user (clustered automatically)  
   - **Insight:** Spots power-reviewers or potential bots (e.g. >25 reviews/day).

7. **Length vs. Sentiment**  
   - **View:** Scatter of review length vs sentiment magnitude, with ±2 StdDev distribution bands  
   - **Insight:** Flags spammy reviews (very short & extreme sentiment).

8. **Fraud Detection & Anomalies**  
   - **View:** Combines volume spikes, reviewer outliers, text-length anomalies  
   - **Insight:** Unified canvas for detecting potential fake reviews.

---

## 4. Key Business Questions Addressed

1. **Which product categories drive the most engagement?**  
2. **How aligned are star ratings and textual sentiment?**  
3. **Are there seasonal or pandemic-driven trends in review volume?**  
4. **Which products balance high ratings with high volumes?**  
5. **Do verified purchases yield different feedback profiles?**  
6. **Can we flag potential fake/spam reviews algorithmically?**

---

## 5. Getting Started

1. Install **Tableau Desktop** (v2022.1+).  
2. Open the workbooks in `dashboards/` (or `.twbx` package).  
3. Point the data source to `reviews_with_vader_sentiment.csv`.  
4. Verify all calculated fields under **Data → [Your Source] → Create Calculated Field…**.  
5. Interact with filters, tooltips, and dashboard actions to explore insights.

---

## 6. Insights Summary

- **Sentiment vs Stars:** Neutral reviews skew slightly negative in text.  
- **Pandemic Dip:** April 2020 sees a ~35% drop in review volume.  
- **Star Performers:** A handful of ASINs achieve >500 reviews & >4.5 avg rating.  
- **Verified Impact:** Verified purchases average ~4.1 stars vs ~4.0 unverified.  
- **Anomaly Detection:** Multiple days exceed +2 StdDev—likely promotions.  
- **Reviewer Outliers:** Top reviewers contribute disproportionately to volume.  
- **Spam Flags:** Ultra-short & extreme-sentiment reviews identified as outliers.

---

> **Happy Data-Driven Storytelling!**
