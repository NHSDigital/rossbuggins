I want to put together a workshop to help our devs.

We have moved to event driven design. We have started using events. Before, we were very command driven. With lambdas putting things into the queues for the next lambdas to process.

We are based on AWS, predominantly typescript lambdas.

We use cloudevents schema for events (and into event bridge).

However, we are still immature in our use of events.

For example, we may have some initial work, and job may have an id, a file blob (base64), and some description. That would be raised by an event. Now, lets say the next step would be to virus scan the file. There would then be an event to say if the file was safe. And then lets say the final step would be to save it, with the description as metadata in s3.

At present, the virus scanning lambda would be taking the description, and saving it, and then reemmiting that discription in its event. The "saver" would then just listen for that one event.

Instead, I think the virus scanner should only be interested in the id and the base64 data, and only emmit info in the event that it "owns" eg is the file safe or not.

The "saver" lambda, should then be listening for BOTH events, and only saving once it has both events.

first of all, does this make sense, is it sensible? i want you to put together a short summury of this pattern, why it is useful, and with a few examples. Maybe some diagrams (c4?) and if you needed event payload examples, use json and cloudevents.

For the example scnerio, i want something "fun", maybe where the final lambda is waiting on 3 events? I want to then have a workshop style activities.

Basically, i want a learning pack, to work through with architects and developers, and to get them into this way of thinking.

We need to concider things, like how is the "state" stored of the different events that we are waiting for. what do we do when all events aren't received. There are likely other things to think about to? 