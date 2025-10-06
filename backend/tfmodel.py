# generation of the tensorflow model, to get exported to .tflite for use within react-native

import os
import tensorflow as tf 
import numpy as np 
import matplotlib.pyplot as plt 
from tensorflow.keras.applications.mobilenet_v3 import preprocess_input

# for now, will test with dogs and cat basic dataset. moving on to bench presses afterwards.
# for bench presses, simply import path rather than downloading from URL and importing from there
_URL = 'https://storage.googleapis.com/mledu-datasets/cats_and_dogs_filtered.zip'
path_to_zip = tf.keras.utils.get_file('cats_and_dogs.zip', origin=_URL, extract=True)
PATH = os.path.join(os.path.dirname(path_to_zip), 'cats_and_dogs_filtered')
print(PATH)
# code above pulls dataset

train_dir = os.path.join(PATH, 'train')
validation_dir = os.path.join(PATH, 'validation')

BATCH_SIZE = 32
IMG_SIZE = (160, 160) # px, px

train_dataset = tf.keras.utils.image_dataset_from_directory(train_dir, shuffle=True, batch_size=BATCH_SIZE, image_size=IMG_SIZE)
validation_dataset = tf.keras.utils.image_dataset_from_directory(validation_dir, shuffle=True, batch_size=BATCH_SIZE, image_size=IMG_SIZE)
# pulls two datasets, for training and validation, defining batch size and img size (px)

class_names = train_dataset.class_names

'''
# optional show, first imgs of dataset
class_names = train.dataset.class_names


'''
# moving 20% to a train batch, dataset doesn't have. same with bench presses
val_batches = tf.data.experimental.cardinality(validation_dataset) # determines how much data is available for validation set
test_dataset = validation_dataset.take(val_batches // 5) # // -> floor division operator
validation_dataset = validation_dataset.skip(val_batches // 5)

print("Num val batches: %d" % tf.data.experimental.cardinality(validation_dataset))
print("Num test batches %d" % tf.data.experimental.cardinality(test_dataset))


# autotune dataset, image loading performance benefit
AUTOTUNE = tf.data.AUTOTUNE
train_dataset = train_dataset.prefetch(buffer_size=AUTOTUNE)
validation_dataset = validation_dataset.prefetch(buffer_size=AUTOTUNE)
test_dataset = test_dataset.prefetch(buffer_size=AUTOTUNE)


# data augmentation, for a smaller dataset. rotation, object movement, etc. 
# useful for bench dataset, and other datasets whre you will only have 50-100 imgs
data_augmentation = tf.keras.Sequential([
    tf.keras.layers.RandomFlip('horizontal'),  
    tf.keras.layers.RandomRotation(0.2),
])

# model rescaling (kinda like normalization in ML - [-1, 1] inputs)
preprocess_input = tf.keras.applications.mobilenet_v3.preprocess_input
rescale = tf.keras.layers.Rescaling(1./127.5, offset=-1)

# for now, pretrained convnets
# later, fine-tuned convnets - diff layers - real dataset
IMG_SHAPE = IMG_SIZE + (3,)
base_model = tf.keras.applications.MobileNetV3Small(input_shape=IMG_SHAPE, include_top=False, weights='imagenet')

image_batch, label_batch = next(iter(train_dataset))
feature_batch = base_model(image_batch)
print(feature_batch.shape) # feature shape MobileNetV3 -> (32, 5, 5, 576)

base_model.trainable = False
base_model.summary()

global_average_layer = tf.keras.layers.GlobalAveragePooling2D() # 2d average pooling input signal conv neural net
feature_batch_avg = global_average_layer(feature_batch)
print(feature_batch_avg.shape)

prediction_layer = tf.keras.layers.Dense(1, activation="sigmoid")
prediction_batch = prediction_layer(feature_batch_avg)
print(prediction_batch.shape)

inputs = tf.keras.Input(shape=(160, 160, 3))
x = data_augmentation(inputs)
x = preprocess_input(x)
x = base_model(x, training=False)
x = global_average_layer(x)
x = tf.keras.layers.Dropout(0.2)(x)
outputs = prediction_layer(x)
model = tf.keras.Model(inputs, outputs)

model.summary()

# print diagram
tf.keras.utils.plot_model(model, show_shapes=True)


# compile, train over epochs
base_learning_rate = 0.0001 
model.compile(optimizer=tf.keras.optimizers.Adam(learning_rate = base_learning_rate), 
              loss=tf.keras.losses.BinaryCrossentropy(),
              metrics=[tf.keras.metrics.BinaryAccuracy(threshold=0.5, name='accuracy')])

epochs = 10 #subject to change
loss0, accuracy0 = model.evaluate(validation_dataset)

print("initial loss: {:.2f}".format(loss0))
print("initial accuracy: {:.2f}".format(accuracy0))

# model training history
history = model.fit(train_dataset,
                    epochs=epochs,
                    validation_data=validation_dataset)

# testing with test dataset - in our case, we need to change this code for image verification over new image fed in.
loss, accuracy = model.evaluate(test_dataset)
print(accuracy)

image_batch, label_batch = test_dataset.as_numpy_iterator().next()
predictions = model.predict_on_batch(image_batch).flatten()
predictions = tf.where (predictions < 0.5, 0, 1)

print("Predictions:\n", predictions.numpy())
print("Labels (Real):\n", label_batch)



# print prediction diagram result
'''
plt.figure(figsize=(10, 10))
for i in range(9):
    ax = plt.subplot(3, 3, i+1)
    plt.imshow(image_batch[i].astype("uint8"))
    plt.title(class_names[predictions[i]])
    plt.axis("off")
'''

# model fine-tune