import { useState, useEffect, useCallback } from 'react';
import { ref, onValue, push, remove, set, get } from 'firebase/database';
import { db } from '../firebase';

export function useCards(sessionId, userId) {
  const [cards, setCards] = useState({});
  const [votes, setVotes] = useState({});

  useEffect(() => {
    if (!sessionId) return;
    const cardsRef = ref(db, `sessions/${sessionId}/cards`);
    const unsubCards = onValue(cardsRef, (snap) => {
      setCards(snap.val() || {});
    });
    return unsubCards;
  }, [sessionId]);

  useEffect(() => {
    if (!sessionId) return;
    const votesRef = ref(db, `sessions/${sessionId}/votes`);
    const unsubVotes = onValue(votesRef, (snap) => {
      setVotes(snap.val() || {});
    });
    return unsubVotes;
  }, [sessionId]);

  const addCard = useCallback((category, content, authorName) => {
    if (!sessionId || !content.trim()) return;
    const cardsRef = ref(db, `sessions/${sessionId}/cards`);
    push(cardsRef, {
      category,
      content: content.trim(),
      authorId: userId,
      authorName,
      createdAt: Date.now(),
    });
  }, [sessionId, userId]);

  const deleteCard = useCallback((cardId) => {
    remove(ref(db, `sessions/${sessionId}/cards/${cardId}`));
    remove(ref(db, `sessions/${sessionId}/votes/${cardId}`));
  }, [sessionId]);

  const toggleVote = useCallback(async (cardId) => {
    const voteRef = ref(db, `sessions/${sessionId}/votes/${cardId}/${userId}`);
    const snap = await get(voteRef);
    if (snap.exists()) {
      remove(voteRef);
    } else {
      set(voteRef, true);
    }
  }, [sessionId, userId]);

  const getVoteCount = useCallback((cardId) => {
    const cardVotes = votes[cardId];
    return cardVotes ? Object.keys(cardVotes).length : 0;
  }, [votes]);

  const hasVoted = useCallback((cardId) => {
    return !!(votes[cardId]?.[userId]);
  }, [votes, userId]);

  const getUserVoteCount = useCallback(() => {
    let count = 0;
    for (const cardId of Object.keys(votes)) {
      if (votes[cardId]?.[userId]) count++;
    }
    return count;
  }, [votes, userId]);

  return { cards, votes, addCard, deleteCard, toggleVote, getVoteCount, hasVoted, getUserVoteCount };
}
