import { useState, useEffect, useCallback } from 'react';
import { PERFORMANCE_CONFIG } from '../performance.config';

interface UseProgressiveLoadOptions<T> {
 data: T[];
 initialLoad?: number;
 chunkSize?: number;
 delay?: number;
}

export function useProgressiveLoad<T>({
 data,
 initialLoad = PERFORMANCE_CONFIG.INITIAL_LOAD,
 chunkSize = PERFORMANCE_CONFIG.ITEMS_PER_PAGE,
 delay = PERFORMANCE_CONFIG.BACKGROUND_LOAD_DELAY
}: UseProgressiveLoadOptions<T>) {
 const [displayedData, setDisplayedData] = useState<T[]>([]);
 const [isLoading, setIsLoading] = useState(false);
 const [currentIndex, setCurrentIndex] = useState(0);

 // Load initial batch immediately
 useEffect(() => {
 if (data.length > 0) {
 setDisplayedData(data.slice(0, initialLoad));
 setCurrentIndex(initialLoad);
 }
 }, [data, initialLoad]);

 // Load remaining data in background
 useEffect(() => {
 if (currentIndex >= data.length || currentIndex === 0) return;

 const timer = setTimeout(() => {
 setIsLoading(true);
 const nextBatch = data.slice(currentIndex, currentIndex + chunkSize);
 
 if (nextBatch.length > 0) {
 setDisplayedData(prev => [...prev, ...nextBatch]);
 setCurrentIndex(prev => prev + chunkSize);
 }
 
 setIsLoading(false);
 }, delay);

 return () => clearTimeout(timer);
 }, [data, currentIndex, chunkSize, delay]);

 const loadMore = useCallback(() => {
 if (currentIndex >= data.length) return;
 
 const nextBatch = data.slice(currentIndex, currentIndex + chunkSize);
 setDisplayedData(prev => [...prev, ...nextBatch]);
 setCurrentIndex(prev => prev + chunkSize);
 }, [data, currentIndex, chunkSize]);

 const reset = useCallback(() => {
 setDisplayedData(data.slice(0, initialLoad));
 setCurrentIndex(initialLoad);
 }, [data, initialLoad]);

 return {
 displayedData,
 isLoading,
 hasMore: currentIndex < data.length,
 loadMore,
 reset,
 progress: data.length > 0 ? (displayedData.length / data.length) * 100 : 0
 };
}
