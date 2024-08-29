import pandas as pd
import json

def topic_word_plot(data_val):
    # Define the path based on user selection
    if data_val == 'shake50':
        data_path = 'shake50_word_topic_distribution.csv'
    elif data_val == 'moviereview':
        data_path = 'moviereview_word_topic_distribution.csv'
    else:
        data_path = 'moviereview_word_topic_distribution.csv'
    
    # Load the data
    data = pd.read_csv(data_path)
    
    # Get all topics (columns) except 'word'
    all_topics = [col for col in data.columns if col != 'word']
    
    # Initialize the dictionary to store topic word data
    topic_word_data = {}
    
    # Populate the dictionary
    for index, row in data.iterrows():
        for topic in all_topics:
            if row[topic] > 0:  # Consider only non-zero entries
                if topic not in topic_word_data:
                    topic_word_data[topic] = {}
                topic_word_data[topic][row['word']] = row[topic]
    
    # Construct the filename dynamically based on the data_val
    json_filename = f"{data_val}_topic_word_data.json"

    # Serialize and save the dictionary to a JSON file
    with open(json_filename, 'w') as json_file:
        json.dump(topic_word_data, json_file, indent=4)

    return topic_word_data

# Example usage
data_val = 'shake50'  # This would be dynamically set in practice
topic_word_data = topic_word_plot(data_val)
print(f"Topic word data has been saved to '{data_val}_topic_word_data.json'.")