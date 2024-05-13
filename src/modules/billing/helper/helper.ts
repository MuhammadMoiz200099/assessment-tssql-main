export const calculateRemainingDays = (startDate: number, endDate: number): number => {
    const startTime = new Date(startDate).getTime();
    const endTime = new Date(endDate).getTime();

    const milliSecPerDay = 24 * 60 * 60 * 1000;
    const milliSecRemaining = endTime - startTime;

    const remainingDays = Math.ceil(milliSecRemaining / milliSecPerDay);

    return remainingDays;
}