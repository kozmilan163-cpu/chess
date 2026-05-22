export const FollowSystem = {
  getFollowing: (): string[] => {
    const profile = JSON.parse(localStorage.getItem('chess_profile') || '{}');
    return profile.following || [];
  },

  getFollowersCount: (username: string): number => {
    const allProfiles = JSON.parse(localStorage.getItem('chess_follows') || '{}');
    return (allProfiles[username]?.followers || []).length;
  },

  getFollowingCount: (username: string): number => {
    const allProfiles = JSON.parse(localStorage.getItem('chess_follows') || '{}');
    return (allProfiles[username]?.following || []).length;
  },

  isFollowing: (targetUsername: string): boolean => {
    const profile = JSON.parse(localStorage.getItem('chess_profile') || '{}');
    return (profile.following || []).includes(targetUsername);
  },

  follow: (targetUsername: string): void => {
    const profile = JSON.parse(localStorage.getItem('chess_profile') || '{}');
    const following = profile.following || [];
    
    if (!following.includes(targetUsername)) {
      following.push(targetUsername);
      profile.following = following;
      localStorage.setItem('chess_profile', JSON.stringify(profile));
      
      const allProfiles = JSON.parse(localStorage.getItem('chess_follows') || '{}');
      if (!allProfiles[targetUsername]) {
        allProfiles[targetUsername] = { followers: [], following: [] };
      }
      if (!allProfiles[targetUsername].followers.includes(profile.username)) {
        allProfiles[targetUsername].followers.push(profile.username);
      }
      localStorage.setItem('chess_follows', JSON.stringify(allProfiles));
    }
  },

  unfollow: (targetUsername: string): void => {
    const profile = JSON.parse(localStorage.getItem('chess_profile') || '{}');
    const following = (profile.following || []).filter(u => u !== targetUsername);
    profile.following = following;
    localStorage.setItem('chess_profile', JSON.stringify(profile));
    
    const allProfiles = JSON.parse(localStorage.getItem('chess_follows') || '{}');
    if (allProfiles[targetUsername]) {
      allProfiles[targetUsername].followers = (allProfiles[targetUsername].followers || []).filter(
        u => u !== profile.username
      );
    }
    localStorage.setItem('chess_follows', JSON.stringify(allProfiles));
  }
};
