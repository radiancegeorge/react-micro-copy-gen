import React from 'react';

export default function Calls({ user }) {
  findText("Plain");
  findText(`Hi ${user.firstName}`);
  findText(messageFromServer);
  return null;
}
