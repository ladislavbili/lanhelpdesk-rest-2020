import * as fakeData from './fakeData';

export const resolvers = {
  Query: {
    tasks: () => {
      return fakeData.tasks.map( (task) => ({
        ...task,
        tags: fakeData.tags.filter( (tag) => task.tags.includes(tag.id) ) ,
      }) )
    }
  },
};
