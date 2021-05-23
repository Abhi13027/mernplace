import React from "react";
import UserItem from "../UserItem/UserItem";
import "./UserList.css";

function UserList(props) {
  if (props.items.length === 0) {
    return (
      <div className="center">
        <h2>No users Found</h2>
      </div>
    );
  }
  return (
    <ul className="users-list">
      {props.items.map((user) => (
        <UserItem
          key={user.id}
          id={user.id}
          image={user.image}
          name={user.name}
          placeCount={user.places.length}
        ></UserItem>
      ))}
    </ul>
  );
}

export default UserList;
