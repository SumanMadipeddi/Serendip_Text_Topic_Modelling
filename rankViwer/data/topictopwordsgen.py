import numpy as np
import pandas as pd

def get_top_topics(row, top_n=10):
    numeric_values = row.drop('file').astype(float)
    top_topics = numeric_values.nlargest(top_n).index.tolist()
    return ','.join(top_topics)

def top_topic_word(dataset):
    if dataset == 'shake50':
        data_path = 'shake50_doc_topic_distribution.csv'
    elif dataset == 'moviereview':
        data_path = 'moviereview_doc_topic_distribution.csv'
    else:
        data_path = 'moviereview_doc_topic_distribution.csv'
        
    data  = pd.read_csv(data_path)
    
    new_df = pd.DataFrame(columns=['Title', 'Topics'])
    new_df['Title'] = data['file'].apply(lambda x: x.split('.')[0])
    new_df['Topics'] = data.apply(get_top_topics, axis=1)

    filename = f"{dataset}_top_topic_word_data.csv"
    # Save the new DataFrame to a CSV file
    new_df.to_csv(filename, index=False)

dataset = 'shake50'
topic_word_data = top_topic_word(dataset)
print(f"Top topic word data has been saved to '{dataset}_top_topic_word_data.csv'.")