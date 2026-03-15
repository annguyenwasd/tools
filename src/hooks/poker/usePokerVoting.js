import { useState, useEffect, useCallback } from 'react';
import { ref, onValue, set, update, remove, push } from 'firebase/database';
import { db } from '../../firebase';

export function usePokerVoting(sessionId, currentStoryId) {
  const [stories, setStories] = useState({});
  const [votes, setVotes] = useState({});

  useEffect(() => {
    if (!sessionId) return;
    const storiesRef = ref(db, `poker/${sessionId}/stories`);
    return onValue(storiesRef, (snap) => {
      setStories(snap.val() || {});
    });
  }, [sessionId]);

  useEffect(() => {
    if (!sessionId || !currentStoryId) {
      setVotes({});
      return;
    }
    const votesRef = ref(db, `poker/${sessionId}/votes/${currentStoryId}`);
    return onValue(votesRef, (snap) => {
      setVotes(snap.val() || {});
    });
  }, [sessionId, currentStoryId]);

  const addStory = useCallback(async (story) => {
    const storiesRef = ref(db, `poker/${sessionId}/stories`);
    const existingCount = Object.keys(stories).length;
    await push(storiesRef, {
      formattedId: story.formattedId || '',
      name: story.name,
      description: story.description || '',
      finalEstimate: story.planEstimate || '',
      order: existingCount,
    });
  }, [sessionId, stories]);

  const importStories = useCallback(async (storyList) => {
    const existingCount = Object.keys(stories).length;
    const updates = {};
    storyList.forEach((story, i) => {
      const key = `imported_${Date.now()}_${i}`;
      updates[key] = {
        formattedId: story.formattedId || '',
        name: story.name,
        description: story.description || '',
        finalEstimate: story.planEstimate || '',
        order: existingCount + i,
      };
    });
    await update(ref(db, `poker/${sessionId}/stories`), updates);
  }, [sessionId, stories]);

  const setFinalEstimate = useCallback(async (storyId, estimate) => {
    await update(ref(db, `poker/${sessionId}/stories/${storyId}`), { finalEstimate: estimate });
  }, [sessionId]);

  const castVote = useCallback(async (userId, value) => {
    if (!currentStoryId) return;
    await set(ref(db, `poker/${sessionId}/votes/${currentStoryId}/${userId}`), value);
  }, [sessionId, currentStoryId]);

  const clearVotes = useCallback(async () => {
    if (!currentStoryId) return;
    await remove(ref(db, `poker/${sessionId}/votes/${currentStoryId}`));
  }, [sessionId, currentStoryId]);

  const deleteStory = useCallback(async (storyId) => {
    await remove(ref(db, `poker/${sessionId}/stories/${storyId}`));
    await remove(ref(db, `poker/${sessionId}/votes/${storyId}`));
  }, [sessionId]);

  return { stories, votes, addStory, importStories, setFinalEstimate, castVote, clearVotes, deleteStory };
}
