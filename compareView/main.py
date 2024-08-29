import pandas as pd
from gensim import corpora, models
import os
from nltk.corpus import stopwords
from nltk.stem.wordnet import WordNetLemmatizer
import string
import nltk

# Download necessary NLTK resources
nltk.download('stopwords')
nltk.download('wordnet')

def preprocess(text):
    stop = set(stopwords.words('english'))
    exclude = set(string.punctuation)
    lemma = WordNetLemmatizer()
    stop_free = " ".join([word for word in text.lower().split() if word not in stop])
    punc_free = ''.join(ch for ch in stop_free if ch not in exclude)
    normalized = " ".join(lemma.lemmatize(word) for word in punc_free.split())
    return normalized

shake_50_dir = './Movie_review'
doc_names = [f for f in os.listdir(shake_50_dir) if f.endswith('.txt')]
shake50_texts = [open(os.path.join(shake_50_dir, f), 'r', encoding='utf-8').read() for f in doc_names]
doc_clean = [preprocess(doc).split() for doc in shake50_texts]

dictionary = corpora.Dictionary(doc_clean)
doc_term_matrix = [dictionary.doc2bow(doc) for doc in doc_clean]
num_tops = 50

ldamodel = models.ldamodel.LdaModel(doc_term_matrix, num_topics=num_tops, id2word=dictionary, passes=50)

# Document-topic distributions
doc_topic_dists = []
for doc_bow in doc_term_matrix:
    doc_topics = ldamodel.get_document_topics(doc_bow, minimum_probability=0)
    doc_topic_probs = [prob for _, prob in doc_topics]
    doc_topic_dists.append(doc_topic_probs)

# Convert to DataFrame and save
df_doc_topics = pd.DataFrame(doc_topic_dists, index=doc_names, columns=[f'Topic {i+1}' for i in range(num_tops)])
df_doc_topics.to_csv('./moviereview_doc_topic_distribution.csv')

# Word-topic distributions
word_topics = {dictionary[id]: value for id, value in ldamodel.id2word.items()}
word_topic_dists = pd.DataFrame(columns=[f'Topic {i+1}' for i in range(num_tops)])

for word_id, word in word_topics.items():
    topic_probs = ldamodel.get_term_topics(word_id, minimum_probability=0)
    row = [0] * num_tops
    for topic_id, prob in topic_probs:
        row[topic_id] = prob
    word_topic_dists.loc[word] = row

word_topic_dists.to_csv('./moviereview_word_topic_distribution.csv')

print("Document-topic and word-topic distributions have been saved to their respective CSV files.")